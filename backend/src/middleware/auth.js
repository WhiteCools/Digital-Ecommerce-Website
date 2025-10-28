import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - Check if user is authenticated
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 🚨 CRITICAL: Check if this is a pending 2FA token
      if (decoded.purpose === '2fa-pending') {
        return res.status(401).json({
          success: false,
          message: 'Please complete 2FA verification first',
        });
      }

      // 🚨 Security: Reject any token with 'purpose' field (should only have 'id')
      if (decoded.purpose && decoded.purpose !== undefined) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format',
        });
      }

      // 🚨 Security: Valid auth tokens must have 'id' field only
      if (!decoded.id || Object.keys(decoded).filter(k => k !== 'id' && k !== 'iat' && k !== 'exp').length > 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token structure',
        });
      }

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated',
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};