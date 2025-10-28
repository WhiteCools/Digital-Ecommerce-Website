import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Copy, Check, AlertTriangle, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TwoFactorSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Setup, 2: Verify, 3: Complete
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState(null);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const { data } = await api.get('/auth/2fa/status');
      setTwoFactorStatus(data.data);
      if (data.data.enabled) {
        navigate('/profile');
      }
          } catch (error) {
        // Failed to check 2FA status
      }
  };

  const handleSetup = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.post('/auth/2fa/setup');
      
      setQrCode(data.data.qrCode);
      setSecret(data.data.secret);
      setBackupCodes(data.data.backupCodes);
      setStep(2);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      await api.post('/auth/2fa/verify', {
        token: verificationCode,
      });
      
      setStep(3);
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const downloadBackupCodes = () => {
          const content = `DigitalCommerce 2FA Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\nUser: ${user.email}\n\n${backupCodes.join('\n')}\n\nIMPORTANT: Store these codes securely. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
          a.download = 'digitalcommerce-2fa-backup-codes.txt';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Two-Factor Authentication
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add an extra layer of security to your account
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                s <= step 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-2 ${
                  s < step 
                    ? 'bg-red-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Introduction */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Enable Two-Factor Authentication
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-500 font-semibold">1</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Install Authenticator App</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Download Google Authenticator or Authy on your phone</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-500 font-semibold">2</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Scan QR Code</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Use your app to scan the QR code we will provide</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-500 font-semibold">3</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Enter Verification Code</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enter the 6-digit code from your app to verify</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSetup}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Step 2: Scan QR Code */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Scan QR Code
            </h2>
            
            {/* QR Code */}
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex justify-center mb-4">
                <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Or enter this code manually:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded text-sm font-mono text-gray-900 dark:text-gray-100">
                    {secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(secret)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {copiedCode ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Backup Codes */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Save Your Backup Codes
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-400 mb-3">
                Store these codes securely. Each can be used once if you lose access to your authenticator app.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {backupCodes.map((code, index) => (
                  <code key={index} className="bg-white dark:bg-gray-800 px-3 py-2 rounded text-sm font-mono text-center">
                    {code}
                  </code>
                ))}
              </div>
              <button
                onClick={downloadBackupCodes}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded transition-colors"
              >
                Download Backup Codes
              </button>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerify}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter 6-digit code from your app
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center text-2xl tracking-widest font-mono mb-4"
                placeholder="000000"
                maxLength={6}
                required
              />
              
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify and Enable'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              2FA Enabled Successfully!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your account is now protected with two-factor authentication.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                <Smartphone className="w-5 h-5 mr-2" />
                Next time you log in:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 ml-7">
                <li>� Enter your email and password as usual</li>
                <li>� You will be asked for a 6-digit code</li>
                <li>� Open your authenticator app and enter the code</li>
                <li>� Use a backup code if you do not have access to your phone</li>
              </ul>
            </div>
            
            <button
              onClick={() => navigate('/profile')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Go to Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;
