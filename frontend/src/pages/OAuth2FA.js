//pages/OAuth2FA.js
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from "../services/api";
import { useNotification } from '../components/NotificationPopup';

export default function OAuth2FA() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const tempToken = searchParams.get('tempToken');

  useEffect(() => {
    // If no temp token, redirect to login
    if (!tempToken) {
      navigate('/login', { replace: true });
    }
  }, [tempToken, navigate]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && twoFactorCode.length === 6) {
      handle2FAVerification();
    }
  };

  // Updated redirect function with role-based logic (same as Login component)
  const redirectAfterLogin = (user) => {
    // Check user role first
    if (user.role === 2) {
      // Admin user - redirect to admin page
      showNotification('success', 'Welcome back, Admin!');
      window.location.href = '/admin';
      return;
    }
    
    // Regular user (role 1) - check if profile is complete
    const isProfileComplete = user.name && user.isOnboardingComplete;
    
    if (isProfileComplete) {
      // Profile is complete - go to dashboard
      showNotification('success', 'Login successful! Welcome back!');
      window.location.href = '/dashboard';
      
    } else {
      // Profile is incomplete - go to onboarding
      showNotification('warning', 'Please complete your profile setup!');
      window.location.href = '/onboarding';
    }
  };

  const handle2FAVerification = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setError('Please enter the 6-digit authentication code');
      showNotification('error', 'Please enter a valid 6-digit code!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/github/verify-2fa', {
        tempToken: tempToken,
        twoFactorCode: twoFactorCode
      });

      console.log('GitHub OAuth 2FA verification successful:', response.data);
      
      // Store the JWT token
      const { token, user, usedBackupCode } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Show backup code usage notification if applicable
      if (usedBackupCode) {
        console.log(`Backup code ${usedBackupCode} was used`);
        showNotification('warning', 'Backup code used! Consider regenerating backup codes.');
      }
      
      showNotification('success', 'GitHub login with 2FA successful!');
      
      // Redirect based on user profile status
      redirectAfterLogin(user);
      
    } catch (err) {
      console.error('GitHub OAuth 2FA verification error:', err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
        showNotification('error', err.response.data.message);
      } else {
        setError('Invalid authentication code. Please try again.');
        showNotification('error', 'Invalid authentication code!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login', { replace: true });
  };

  if (!tempToken) {
    return null; // Component will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Two-Factor Authentication
            </h1>
            <p className="text-gray-500">
              Complete your GitHub login with 2FA verification
            </p>
          </div>

          {/* GitHub Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl flex items-center">
            <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Signing in with GitHub</p>
              <p className="text-xs text-gray-500">2FA verification required</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* 2FA Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>

            {/* 2FA Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Authentication Code
              </label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Z0-9]/g, "").slice(0, 6);
                  setTwoFactorCode(value);
                }}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
                placeholder="123456"
                maxLength="6"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter the 6-digit code from your authenticator app or backup code
              </p>
            </div>

            {/* Back to Login Button */}
            <div className="text-center">
              <button
                onClick={handleBackToLogin}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                ← Back to login
              </button>
            </div>

            {/* Verify 2FA Button */}
            <button
              onClick={handle2FAVerification}
              disabled={isLoading || twoFactorCode.length !== 6}
              className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  Complete GitHub Login
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="mt-6 text-center space-x-4 text-sm">
          <a href="#" className="text-gray-500 hover:text-gray-700">Privacy Policy</a>
          <span className="text-gray-300">•</span>
          <a href="#" className="text-gray-500 hover:text-gray-700">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}