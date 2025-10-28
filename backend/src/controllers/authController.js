import User from '../models/User.js';

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateAuthToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, twoFactorToken, pendingToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password +twoFactorSecret +twoFactorBackupCodes');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // 🔐 Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // 🚨 Check if account is locked due to failed 2FA attempts
      if (user.twoFactorLockedUntil && user.twoFactorLockedUntil > Date.now()) {
        const remainingTime = Math.ceil((user.twoFactorLockedUntil - Date.now()) / 60000);
        return res.status(429).json({
          success: false,
          message: `Account temporarily locked due to multiple failed 2FA attempts. Try again in ${remainingTime} minutes.`,
        });
      }
      
      // Reset failed attempts if lock period has expired
      if (user.twoFactorLockedUntil && user.twoFactorLockedUntil <= Date.now()) {
        user.twoFactorFailedAttempts = 0;
        user.twoFactorLockedUntil = null;
        await user.save();
      }
      // If no 2FA token provided, DON'T send any token yet
      if (!twoFactorToken) {
        // Store user info in a temporary session identifier (NOT a valid auth token)
        const crypto = await import('crypto');
        const tempSessionId = crypto.default.randomBytes(32).toString('hex');
        
        // Store pending 2FA session temporarily (use Redis in production)
        // For now, we'll use a simple in-memory store or send encrypted user ID
        const jwt = await import('jsonwebtoken');
        const pendingToken = jwt.default.sign(
          { 
            userId: user._id,
            purpose: '2fa-pending',
            exp: Math.floor(Date.now() / 1000) + (5 * 60) // 5 minutes
          },
          process.env.JWT_SECRET
        );
        
        return res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          pendingToken: pendingToken, // This is NOT a valid auth token
          message: 'Please provide your 2FA code',
        });
      }

      // Validate pending token first
      if (pendingToken) {
        const jwt = await import('jsonwebtoken');
        try {
          const decoded = jwt.default.verify(pendingToken, process.env.JWT_SECRET);
          
          // Verify this is a 2FA pending token and matches the user
          if (decoded.purpose !== '2fa-pending' || decoded.userId !== user._id.toString()) {
            return res.status(401).json({
              success: false,
              message: 'Invalid session. Please login again.',
            });
          }
        } catch (error) {
          return res.status(401).json({
            success: false,
            message: 'Session expired. Please login again.',
          });
        }
      } else {
        // If no pending token but 2FA token provided, reject
        return res.status(401).json({
          success: false,
          message: 'Invalid request. Please login again.',
        });
      }
      
      // Validate 2FA token
      const speakeasy = await import('speakeasy');
      const crypto = await import('crypto');
      
      let verified = false;
      
      // Check if it's a backup code (8 chars uppercase hex)
      if (twoFactorToken.length === 8 && /^[0-9A-F]+$/i.test(twoFactorToken)) {
        const user2FA = await User.findById(user._id).select('+twoFactorBackupCodes');
        const hashedCode = crypto.default.createHash('sha256').update(twoFactorToken.toUpperCase()).digest('hex');
        const codeIndex = user2FA.twoFactorBackupCodes?.indexOf(hashedCode);

        if (codeIndex !== -1) {
          // Remove used backup code
          user2FA.twoFactorBackupCodes.splice(codeIndex, 1);
          await user2FA.save();
          verified = true;
          console.log(`🔑 Backup code used for login: ${user.email}`);
        }
      } else {
        // Verify TOTP token
        verified = speakeasy.default.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: twoFactorToken,
          window: 2,
        });
      }

      if (!verified) {
        // 🔒 Increment failed attempts
        user.twoFactorFailedAttempts = (user.twoFactorFailedAttempts || 0) + 1;
        
        // Lock account after 5 failed attempts for 30 minutes
        if (user.twoFactorFailedAttempts >= 5) {
          user.twoFactorLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          await user.save();
          
          console.log(`🚨 Account locked due to failed 2FA attempts: ${user.email}`);
          
          return res.status(429).json({
            success: false,
            message: 'Too many failed attempts. Account locked for 30 minutes.',
          });
        }
        
        await user.save();
        
        const remainingAttempts = 5 - user.twoFactorFailedAttempts;
        return res.status(401).json({
          success: false,
          message: `Invalid 2FA code. ${remainingAttempts} attempts remaining.`,
        });
      }
      
      // 🎉 Reset failed attempts on successful verification
      user.twoFactorFailedAttempts = 0;
      user.twoFactorLockedUntil = null;

      console.log(`✅ 2FA login successful: ${user.email}`);
    }

    user.lastLogin = Date.now();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
    };

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = req.body.newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};