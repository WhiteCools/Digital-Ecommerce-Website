// 🔒 Frontend Admin Validation Utilities

/**
 * Check if user is admin
 * @param {Object} user - User object from AuthContext
 * @returns {Boolean}
 */
export const isAdmin = (user) => {
  if (!user) return false;
  return user.role === 'admin';
};

/**
 * Check if user is authenticated
 * @param {Boolean} isAuthenticated - Auth status from AuthContext
 * @param {Object} user - User object from AuthContext
 * @returns {Boolean}
 */
export const isAuthenticatedAdmin = (isAuthenticated, user) => {
  return isAuthenticated && isAdmin(user);
};

/**
 * Get admin display name
 * @param {Object} user - User object
 * @returns {String}
 */
export const getAdminDisplayName = (user) => {
  if (!user) return 'Admin';
  return user.name || user.email || 'Admin';
};

/**
 * Validate admin token before making request
 * @param {String} token - JWT token
 * @returns {Boolean}
 */
export const validateAdminToken = (token) => {
  if (!token) return false;
  
  try {
    // Basic validation - check token structure
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload (without verification - just for checking)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return false;
    }
    
    // Check if token has purpose field (should not for admin tokens)
    if (payload.purpose) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Log admin action for audit trail
 * @param {String} action - Action performed
 * @param {Object} details - Action details
 */
export const logAdminAction = (action, details = {}) => {
  const logEntry = {
    action,
    timestamp: new Date().toISOString(),
    ...details,
  };
  
  // In production, send to backend logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to backend logging endpoint
  }
};

/**
 * Format admin error message
 * @param {Error} error - Error object
 * @returns {String}
 */
export const formatAdminError = (error) => {
  if (error.response?.status === 403) {
    return 'Access denied. Administrator privileges required.';
  }
  if (error.response?.status === 401) {
    return 'Session expired. Please login again.';
  }
  if (error.response?.status === 429) {
    return 'Too many requests. Please try again later.';
  }
  return error.response?.data?.message || 'An error occurred. Please try again.';
};

/**
 * Check if action requires confirmation
 * @param {String} action - Action type
 * @returns {Boolean}
 */
export const requiresConfirmation = (action) => {
  const criticalActions = [
    'delete_user',
    'change_role',
    'deactivate_user',
    'delete_product',
    'cancel_order',
  ];
  return criticalActions.includes(action);
};

/**
 * Get confirmation message for action
 * @param {String} action - Action type
 * @param {Object} target - Target object (user, product, etc.)
 * @returns {String}
 */
export const getConfirmationMessage = (action, target) => {
  const messages = {
    delete_user: `Are you sure you want to delete user "${target.name || target.email}"? This action cannot be undone.`,
    change_role: `Are you sure you want to change role for "${target.name || target.email}" to ${target.newRole}?`,
    deactivate_user: `Are you sure you want to deactivate user "${target.name || target.email}"?`,
    delete_product: `Are you sure you want to delete product "${target.name}"?`,
    cancel_order: `Are you sure you want to cancel order #${target.orderId}?`,
  };
  return messages[action] || 'Are you sure you want to perform this action?';
};

export default {
  isAdmin,
  isAuthenticatedAdmin,
  getAdminDisplayName,
  validateAdminToken,
  logAdminAction,
  formatAdminError,
  requiresConfirmation,
  getConfirmationMessage,
};