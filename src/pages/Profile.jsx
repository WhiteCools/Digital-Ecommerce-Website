import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Lock, Save, Edit2, X, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [backupCodesStatus, setBackupCodesStatus] = useState(null);
  const [backupCodesWarning, setBackupCodesWarning] = useState('');

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Malaysia',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Load user data
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || 'Malaysia',
    });

    // Check 2FA status
    check2FAStatus();
  }, [isAuthenticated, user, navigate]);

  const check2FAStatus = async () => {
    try {
      const { data } = await api.get('/auth/2fa/status');
      setTwoFactorEnabled(data.data.enabled);
      
      // 🔒 Handle backup codes status (only if 2FA enabled)
      if (data.data.backupCodesStatus) {
        setBackupCodesStatus(data.data.backupCodesStatus);
        setBackupCodesWarning(data.data.warning || '');
      }
          } catch (err) {
        // Failed to check 2FA status
      }
  };

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.put('/auth/updatedetails', {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: {
          street: profileData.street,
          city: profileData.city,
          state: profileData.state,
          zipCode: profileData.zipCode,
          country: profileData.country,
        },
      });

      // Update auth context
      login(data.data, data.token);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await api.put('/auth/updatepassword', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setSuccess('Password updated successfully!');
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = () => {
    navigate('/2fa-setup');
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setTwoFactorLoading(true);
    setError('');

    try {
      await api.post('/auth/2fa/disable', {
        password: disablePassword
      });
      
      setTwoFactorEnabled(false);
      setShowDisable2FA(false);
      setDisablePassword('');
      setSuccess('Two-factor authentication disabled successfully');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original user data
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || 'Malaysia',
    });
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">My Profile</h1>
                <p className="text-neutral-600">Manage your account information</p>
              </div>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-xl transition-all flex items-center space-x-2"
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin Dashboard</span>
                </button>
              )}
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center space-x-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Profile Information */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user?.name}</h2>
                  <p className="opacity-90">{user?.email}</p>
                  <span className="inline-block mt-1 px-3 py-1 bg-white/20 rounded-full text-sm">
                    {user?.role === 'admin' ? '👑 Admin' : '🛍️ Customer'}
                  </span>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-primary px-4 py-2 rounded-lg font-semibold hover:bg-neutral-100 transition-colors flex items-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Street */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={profileData.street}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={profileData.state}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Zip Code */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={profileData.zipCode}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={profileData.country}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex space-x-4 mt-6">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-secondary text-white py-3 rounded-lg font-semibold hover:bg-secondary-dark transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </motion.button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-100 transition-colors flex items-center space-x-2"
                  >
                    <X className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Two-Factor Authentication Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className={`w-5 h-5 ${twoFactorEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <h3 className="text-lg font-semibold text-primary">Two-Factor Authentication</h3>
                  <p className="text-sm text-neutral-600">
                    {twoFactorEnabled ? '✓ Enhanced security enabled' : 'Add extra security to your account'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {twoFactorEnabled && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    Enabled
                  </span>
                )}
                {!twoFactorEnabled && !showDisable2FA && (
                  <button
                    onClick={handleEnable2FA}
                    className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Enable 2FA
                  </button>
                )}
                {twoFactorEnabled && !showDisable2FA && (
                  <button
                    onClick={() => setShowDisable2FA(true)}
                    className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                  >
                    Disable
                  </button>
                )}
              </div>
            </div>

            {/* Backup Codes Warning (if 2FA enabled and codes low) */}
            {twoFactorEnabled && backupCodesStatus && backupCodesStatus !== 'sufficient' && (
              <div className="p-6 border-b border-neutral-200">
                <div className={`rounded-lg p-4 ${
                  backupCodesStatus === 'none' 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      backupCodesStatus === 'none' ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                    <div>
                      <h4 className={`font-semibold mb-1 ${
                        backupCodesStatus === 'none' ? 'text-red-900' : 'text-yellow-900'
                      }`}>
                        {backupCodesStatus === 'none' ? '⚠️ No Backup Codes' : '⚠️ Backup Codes Low'}
                      </h4>
                      <p className={`text-sm ${
                        backupCodesStatus === 'none' ? 'text-red-800' : 'text-yellow-800'
                      }`}>
                        {backupCodesWarning}
                      </p>
                      <button
                        onClick={handleEnable2FA}
                        className={`mt-2 text-sm font-semibold underline ${
                          backupCodesStatus === 'none' ? 'text-red-700' : 'text-yellow-700'
                        }`}
                      >
                        Generate New Backup Codes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!twoFactorEnabled && !showDisable2FA && (
              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Why enable 2FA?</h4>
                      <p className="text-sm text-blue-800">
                        Two-factor authentication adds an extra layer of security to your account by requiring both your password and a code from your phone to log in.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-neutral-600">
                  <p>• 🔒 Protects your account even if someone knows your password</p>
                  <p>• 📱 Uses authenticator apps like Google Authenticator or Authy</p>
                  <p>• 💾 Get backup codes in case you lose access to your phone</p>
                  <p>• ⚡ Quick setup - takes less than 2 minutes</p>
                </div>
              </div>
            )}

            {showDisable2FA && (
              <form onSubmit={handleDisable2FA} className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">Disable Two-Factor Authentication?</h4>
                      <p className="text-sm text-red-800">
                        Your account will be less secure without 2FA. Enter your password to confirm.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="Enter your password"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={twoFactorLoading || !disablePassword}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {twoFactorLoading ? 'Disabling...' : 'Confirm Disable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisable2FA(false);
                      setDisablePassword('');
                      setError('');
                    }}
                    className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Change Password Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-secondary" />
                <h3 className="text-lg font-semibold text-primary">Password & Security</h3>
              </div>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="text-secondary hover:text-secondary-dark font-semibold transition-colors"
                >
                  Change Password
                </button>
              )}
            </div>

            {showPasswordForm && (
              <form onSubmit={handleUpdatePassword} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-secondary text-white py-3 rounded-lg font-semibold hover:bg-secondary-dark transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setError('');
                    }}
                    className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {!showPasswordForm && (
              <div className="p-6 text-sm text-neutral-600">
                <p>• Use a strong password with at least 6 characters</p>
                <p>• Include numbers and special characters for better security</p>
                <p>• Don't share your password with anyone</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;