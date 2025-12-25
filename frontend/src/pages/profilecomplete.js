import { useState, useEffect } from 'react';

export default function ProfileCompletion() {
  const [formData, setFormData] = useState({
    name: '',
    githubUsername: '',
    referralCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [referralValidation, setReferralValidation] = useState(null);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);

  // Get token from URL or localStorage
  const getToken = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || localStorage.getItem('authToken');
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (error) setError('');
  };

  // Validate referral code with debouncing
  useEffect(() => {
    const validateReferral = async () => {
      if (!formData.referralCode.trim()) {
        setReferralValidation(null);
        return;
      }

      setIsValidatingReferral(true);
      try {
        const token = getToken();
        const response = await fetch('/api/profile/validate-referral', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ code: formData.referralCode })
        });

        const data = await response.json();
        
        if (response.ok) {
          setReferralValidation({
            isValid: true,
            message: data.message,
            referrerName: data.referrerName
          });
        } else {
          setReferralValidation({
            isValid: false,
            message: data.message
          });
        }
      } catch (err) {
        setReferralValidation({
          isValid: false,
          message: 'Failed to validate referral code'
        });
      } finally {
        setIsValidatingReferral(false);
      }
    };

    const timeoutId = setTimeout(validateReferral, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.referralCode]);

  // Handle form submission
  const handleSubmit = async () => {
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (formData.referralCode && referralValidation && !referralValidation.isValid) {
      setError('Please enter a valid referral code or leave it empty');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = getToken();
      const response = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          githubUsername: formData.githubUsername.trim() || null,
          referralCode: formData.referralCode.trim() || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile completed successfully! Redirecting to dashboard...');
        
        // Store token if not already stored
        if (!localStorage.getItem('authToken')) {
          localStorage.setItem('authToken', token);
        }

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        setError(data.message || 'Failed to complete profile');
      }
    } catch (err) {
      console.error('Profile completion error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Completed!</h1>
            <p className="text-gray-500 mb-4">{success}</p>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-500">Tell us a bit more about yourself to get started</p>
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

          {/* Profile Form */}
          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your full name"
                maxLength={100}
              />
            </div>

            {/* GitHub Username Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                GitHub Username (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="githubUsername"
                  value={formData.githubUsername}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="your-github-username"
                  pattern="[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]|[a-zA-Z0-9]"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Link your GitHub profile to show your coding activity
              </p>
            </div>

            {/* Referral Code Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Referral Code (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 uppercase ${
                    referralValidation?.isValid === false 
                      ? 'border-red-300 focus:ring-red-500' 
                      : referralValidation?.isValid === true
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-gray-200 focus:ring-blue-500'
                  }`}
                  placeholder="REFERRAL123"
                  maxLength={20}
                />
                
                {/* Loading/Validation Indicator */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isValidatingReferral ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                  ) : referralValidation?.isValid === true ? (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : referralValidation?.isValid === false ? (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : null}
                </div>
              </div>
              
              {/* Referral Validation Message */}
              {referralValidation && (
                <p className={`text-xs mt-2 ${referralValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {referralValidation.message}
                </p>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                Have a referral code? Enter it here to connect with who invited you
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || !formData.name.trim() || (formData.referralCode && referralValidation && !referralValidation.isValid)}
              className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Completing Profile...
                </>
              ) : (
                <>
                  Complete Profile
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              You can always update this information later in your profile settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}