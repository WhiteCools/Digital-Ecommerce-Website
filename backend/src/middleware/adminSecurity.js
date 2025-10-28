import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// 🔒 EXTRA SECURITY: Admin-specific middleware with enhanced checks
export const adminSecurityCheck = async (req, res, next) => {
  try {
    // ✅ Layer 1: Verify user exists and is loaded
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // ✅ Layer 2: Re-fetch user from database (prevent stale data)
    const currentUser = await User.findById(req.user._id).select('-password');

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // ✅ Layer 3: Verify user is still active
    if (!currentUser.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated',
      });
    }

    // ✅ Layer 4: Verify role is EXACTLY 'admin' (strict comparison)
    if (currentUser.role !== 'admin') {
      // 🚨 Log potential bypass attempt
      console.error(`⚠️ SECURITY ALERT: Non-admin user ${currentUser.email} attempted to access admin route`);
      console.error(`   User ID: ${currentUser._id}`);
      console.error(`   User Role: ${currentUser.role}`);
      console.error(`   IP Address: ${req.ip}`);
      console.error(`   Route: ${req.originalUrl}`);
      console.error(`   Timestamp: ${new Date().toISOString()}`);

      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.',
      });
    }

    // ✅ Layer 5: Check if password was changed after token was issued
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (currentUser.passwordChangedAt) {
        const passwordChangedTimestamp = parseInt(
          currentUser.passwordChangedAt.getTime() / 1000,
          10
        );
        
        if (decoded.iat < passwordChangedTimestamp) {
          return res.status(401).json({
            success: false,
            message: 'Password was changed. Please login again.',
          });
        }
      }
    }

    // ✅ Layer 6: Rate limiting check for admin actions (optional but recommended)
    // Check if admin is making too many requests
    if (req.adminActionCount && req.adminActionCount > 100) {
      return res.status(429).json({
        success: false,
        message: 'Too many admin actions. Please try again later.',
      });
    }

    // ✅ Update req.user with fresh data
    req.user = currentUser;

    // 🎯 Log successful admin access (for audit trail)
    console.log(`✅ Admin Access: ${currentUser.email} -> ${req.method} ${req.originalUrl}`);

    next();
  } catch (error) {
    console.error('❌ Admin security check failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Security verification failed',
    });
  }
};

// 🔒 Prevent admin from modifying their own account
export const preventSelfModification = (req, res, next) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user._id.toString();

  if (targetUserId === currentUserId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot modify your own account. Ask another administrator.',
    });
  }

  next();
};

// 🔒 Verify critical actions with password
export const verifyCriticalAction = async (req, res, next) => {
  try {
    const { adminPassword } = req.body;

    if (!adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password verification required for this action',
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify password
    const isPasswordCorrect = await user.comparePassword(adminPassword);

    if (!isPasswordCorrect) {
      // 🚨 Log failed verification attempt
      console.error(`⚠️ SECURITY ALERT: Failed password verification for critical action`);
      console.error(`   Admin: ${user.email}`);
      console.error(`   Action: ${req.method} ${req.originalUrl}`);
      console.error(`   Timestamp: ${new Date().toISOString()}`);

      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Remove password from body before proceeding
    delete req.body.adminPassword;

    next();
  } catch (error) {
    console.error('❌ Critical action verification failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed',
    });
  }
};

// 🔒 IP Whitelist (Optional - for extra security)
export const ipWhitelist = (req, res, next) => {
  // Only enable in production if you have fixed IP addresses
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
  
  if (allowedIPs.length === 0) {
    return next(); // Skip if no whitelist configured
  }

  const clientIP = req.ip || req.connection.remoteAddress;

  if (!allowedIPs.includes(clientIP)) {
    console.error(`⚠️ SECURITY ALERT: Admin access attempt from unauthorized IP`);
    console.error(`   IP Address: ${clientIP}`);
    console.error(`   User: ${req.user?.email}`);
    console.error(`   Timestamp: ${new Date().toISOString()}`);

    return res.status(403).json({
      success: false,
      message: 'Access denied from this IP address',
    });
  }

  next();
};

// 🔒 Time-based access control (Optional)
export const timeBasedAccess = (req, res, next) => {
  // Only enable if you want to restrict admin access to business hours
  if (process.env.ADMIN_TIME_RESTRICTION !== 'true') {
    return next();
  }

  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  // Allow access only during business hours (9 AM - 6 PM, Mon-Fri)
  const isBusinessHours = hour >= 9 && hour < 18;
  const isWeekday = day >= 1 && day <= 5;

  if (!isBusinessHours || !isWeekday) {
    console.warn(`⚠️ Admin access attempt outside business hours`);
    console.warn(`   User: ${req.user?.email}`);
    console.warn(`   Time: ${now.toISOString()}`);

    return res.status(403).json({
      success: false,
      message: 'Admin access is restricted to business hours (Mon-Fri, 9 AM - 6 PM)',
    });
  }

  next();
};

export default {
  adminSecurityCheck,
  preventSelfModification,
  verifyCriticalAction,
  ipWhitelist,
  timeBasedAccess,
};