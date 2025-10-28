import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import User from '../models/User.js';

// @desc    Generate 2FA secret and QR code
// @route   POST /api/auth/2fa/setup
// @access  Private
export const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled. Disable it first to setup again.',
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
              name: `DigitalCommerce (${user.email})`,
      issuer: 'DigitalCommerce',
      length: 32,
    });

    // Generate backup codes (10 codes)
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    // Hash backup codes before storing
    const hashedBackupCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    // Save secret (but don't enable yet - need verification first)
    user.twoFactorSecret = secret.base32;
    user.twoFactorBackupCodes = hashedBackupCodes;
    user.twoFactorVerified = false;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    console.log(`🔐 2FA setup initiated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes: backupCodes, // Return plain codes ONCE for user to save
        message: 'Scan QR code with Google Authenticator or Authy. Save backup codes securely!',
      },
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA',
    });
  }
};

// @desc    Verify and enable 2FA
// @route   POST /api/auth/2fa/verify
// @access  Private
export const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide verification token',
      });
    }

    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Please setup 2FA first',
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled',
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 steps before/after for time sync issues
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorVerified = true;
    await user.save();

    console.log(`✅ 2FA enabled for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: '2FA has been successfully enabled!',
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA',
    });
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
export const disable2FA = async (req, res) => {
  try {
    const { password, token } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password',
      });
    }

    const user = await User.findById(req.user._id).select('+password +twoFactorSecret');

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Verify 2FA token if provided
    if (token) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2,
      });

      if (!verified) {
        return res.status(400).json({
          success: false,
          message: 'Invalid 2FA code',
        });
      }
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    user.twoFactorVerified = false;
    await user.save();

    console.log(`🔓 2FA disabled for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: '2FA has been disabled',
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA',
    });
  }
};

// @desc    Validate 2FA token during login
// @route   POST /api/auth/2fa/validate
// @access  Public (but requires valid JWT from initial login)
export const validate2FAToken = async (req, res) => {
  try {
    const { token, isBackupCode } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide 2FA code',
      });
    }

    const user = await User.findById(req.user._id)
      .select('+twoFactorSecret +twoFactorBackupCodes');

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled for this account',
      });
    }

    let verified = false;

    // Check if using backup code
    if (isBackupCode) {
      const hashedCode = crypto.createHash('sha256').update(token).digest('hex');
      const codeIndex = user.twoFactorBackupCodes.indexOf(hashedCode);

      if (codeIndex !== -1) {
        // Remove used backup code
        user.twoFactorBackupCodes.splice(codeIndex, 1);
        await user.save();
        verified = true;
        console.log(`🔑 Backup code used by: ${user.email}`);
      }
    } else {
      // Verify TOTP token
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2,
      });
    }

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA code',
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    console.log(`✅ 2FA validated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: '2FA verification successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    console.error('2FA validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate 2FA',
    });
  }
};

// @desc    Get 2FA status
// @route   GET /api/auth/2fa/status
// @access  Private
export const get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorBackupCodes');

    // 🔒 SECURITY: Only return minimal info to prevent enumeration
    const response = {
      success: true,
      data: {
        enabled: user.twoFactorEnabled || false,
      },
    };

    // 🔒 Only show backup codes info if 2FA is actually enabled
    // This prevents attackers from knowing internal state
    if (user.twoFactorEnabled && user.twoFactorVerified) {
      const remaining = user.twoFactorBackupCodes?.length || 0;
      
      // 🔒 Only warn if codes are low, don't reveal exact count
      if (remaining === 0) {
        response.data.backupCodesStatus = 'none';
        response.data.warning = 'No backup codes remaining. Generate new ones!';
      } else if (remaining <= 3) {
        response.data.backupCodesStatus = 'low';
        response.data.warning = 'Backup codes running low. Consider generating new ones.';
      } else {
        response.data.backupCodesStatus = 'sufficient';
      }
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status',
    });
  }
};