import React, { useState, useEffect } from 'react';
import { Copy, Users, Award, Eye, EyeOff, Share2, RefreshCw, Check, X, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../components/NotificationPopup';
import { useNavigate } from 'react-router-dom';

const Referral = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralCodeApplied, setReferralCodeApplied] = useState(false);
  const [applyingCode, setApplyingCode] = useState(false);
  const [codeValidationMessage, setCodeValidationMessage] = useState('');
  const [codeValidationStatus, setCodeValidationStatus] = useState(''); // 'success', 'error', 'validating'
  const [showApplySection, setShowApplySection] = useState(true);

  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // Load dashboard data
  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/referral/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setDashboardData(response.data.data);
      
      // Check if user already has a referral code applied
      if (response.data.data.user.referredBy) {
        setReferralCodeApplied(true);
        setShowApplySection(false);
      }
      
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard');
      showNotification('error', 'Failed to load referral dashboard');
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.slice(0, 3) + '***';
    const maskedDomain = '***' + domain.slice(-4);
    return `${maskedLocal}@${maskedDomain}`;
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      showNotification('success', 'Referral Copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification('error', 'Failed to copy to clipboard');
    }
  };

  const toggleReferralStatus = async () => {
    try {
      const response = await api.post('/referral/toggle-status', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        loadDashboard(); // Reload data
        const newStatus = response.data.data?.referral?.isActive;
        showNotification('success', `Referral code ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      showNotification('error', 'Failed to update referral status');
    }
  };

  const validateAndApplyReferralCode = async () => {
    if (!referralCodeInput.trim()) {
      setCodeValidationMessage('Please enter a referral code');
      setCodeValidationStatus('error');
      showNotification('warning', 'Please enter a referral code');
      return;
    }

    // Check if user is trying to enter their own code
    if (referralCodeInput.toUpperCase() === dashboardData?.user?.referralCode) {
      setCodeValidationMessage('You cannot use your own referral code');
      setCodeValidationStatus('error');
      showNotification('warning', 'You cannot use your own referral code');
      return;
    }

    setApplyingCode(true);
    setCodeValidationStatus('validating');
    setCodeValidationMessage('Validating code...');

    try {
      // First validate the code
      const validateResponse = await api.post('/referral/validate-code', {
        code: referralCodeInput
      });

      if (validateResponse.data.success) {
        // Apply the code
        const applyResponse = await api.post('/referral/apply-code', {
          code: referralCodeInput
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (applyResponse.data.success) {
          setCodeValidationStatus('success');
          setCodeValidationMessage(`Successfully applied referral code from ${validateResponse.data.referral.ownerName || 'user'}!`);
          setReferralCodeApplied(true);
          
          showNotification('success', `Referral code applied successfully from ${validateResponse.data.referral.ownerName || 'user'}!`);
          
          loadDashboard(); // Reload to get updated data
          
          // Hide the apply section and success message after 3 seconds
          setTimeout(() => {
            setShowApplySection(false);
            setCodeValidationMessage('');
            setCodeValidationStatus('');
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Error applying referral code:', err);
      setCodeValidationStatus('error');
      setCodeValidationMessage(err.response?.data?.message || 'Invalid or expired referral code');
      showNotification('error', err.response?.data?.message || 'Invalid or expired referral code');
    } finally {
      setApplyingCode(false);
    }
  };

  const handleReferralCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setReferralCodeInput(value);
    
    // Clear validation messages when user types
    if (codeValidationMessage) {
      setCodeValidationMessage('');
      setCodeValidationStatus('');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="text-gray-600">Loading your referral data...</span>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 text-lg mb-4">Error: {error}</p>
          <button 
            onClick={loadDashboard}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors duration-200 font-medium"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const { user, referral } = dashboardData || {};
  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`;
  
  // Get stats from referral object or default values
  const stats = referral?.stats || {
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    totalPointsEarned: 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center mb-4">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center text-gray-600 hover:text-purple-600 transition-colors duration-200 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Referral Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Track your referrals and earn rewards</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Apply Referral Code Section - Only show if conditions are met */}
        {showApplySection && !referralCodeApplied && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-gray-900">Have a Referral Code?</h2>
                <p className="text-gray-600">Enter a referral code to give credit and earn bonuses</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                If someone referred you, enter their referral code below to give them credit and potentially earn bonuses!
              </p>
              
              <div className="flex space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={handleReferralCodeChange}
                    placeholder="Enter referral code (e.g., JOHN123)"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                      codeValidationStatus === 'success' 
                        ? 'border-green-500 focus:ring-green-500 bg-green-50' 
                        : codeValidationStatus === 'error'
                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-200 focus:ring-purple-500'
                    }`}
                    disabled={applyingCode || referralCodeApplied}
                    maxLength="20"
                  />
                  {codeValidationMessage && (
                    <div className={`mt-2 text-sm flex items-center ${
                      codeValidationStatus === 'success' ? 'text-green-600' : 
                      codeValidationStatus === 'error' ? 'text-red-600' : 
                      'text-blue-600'
                    }`}>
                      {codeValidationStatus === 'success' && <Check className="w-4 h-4 mr-1" />}
                      {codeValidationStatus === 'error' && <X className="w-4 h-4 mr-1" />}
                      {codeValidationStatus === 'validating' && <RefreshCw className="w-4 h-4 mr-1 animate-spin" />}
                      {codeValidationMessage}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={validateAndApplyReferralCode}
                  disabled={!referralCodeInput.trim() || applyingCode || referralCodeApplied}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center"
                >
                  {applyingCode ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    'Apply Code'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Your Referral Code Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">Your Referral Code</h2>
              <p className="text-gray-600">Share your code to earn rewards</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-3xl font-mono font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  {user?.referralCode || 'Not Generated'}
                </div>
                <p className="text-sm text-gray-600">
                  Status: <span className={`font-medium ${referral?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {referral?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(user?.referralCode, 'code')}
                  className="flex items-center px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  disabled={!user?.referralCode}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copySuccess === 'code' ? 'Copied!' : 'Copy'}
                </button>
                {referral && (
                  <button
                    onClick={toggleReferralStatus}
                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                      referral?.isActive 
                        ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                  >
                    {referral?.isActive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {referral?.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {user?.referralCode && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Share Your Referral Link</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 transition-all duration-200"
                />
                <button
                  onClick={() => copyToClipboard(referralLink, 'link')}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  {copySuccess === 'link' ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Referrals</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalReferrals}</p>
          </div>
          
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Successful Referrals</h3>
            <p className="text-3xl font-bold text-green-600">{stats.successfulReferrals}</p>
          </div>
          
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Referrals</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingReferrals}</p>
          </div>
          
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <div className="text-purple-600 font-bold text-2xl">P</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Points Earned</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalPointsEarned}</p>
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <div className="text-indigo-600 font-bold text-xl">S</div>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">Current Balance</h2>
              <p className="text-gray-600">Your available scans and earnings</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-2">Remaining Scans</p>
              <p className="text-4xl font-bold text-indigo-600">{user?.remainingScans || 0}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 space-y-1">
                <p>Each successful referral = +5 scans</p>
                <p>Total points earned = {stats.totalPointsEarned} scans from referrals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referred Users Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">Referred Users ({referral?.referredUsers?.length || 0})</h2>
              <p className="text-gray-600">People who joined using your code</p>
            </div>
          </div>
          
          {!referral?.referredUsers?.length ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg mb-2">No referred users yet</p>
              <p className="text-gray-400">Start sharing your referral code to see users here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {referral.referredUsers.map((ref, index) => (
                <div key={index} className="flex items-center justify-between p-6 border border-gray-100 rounded-2xl hover:shadow-md transition-shadow duration-200">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-700 font-semibold">
                          {ref.user?.name?.charAt(0)?.toUpperCase() || ref.user?.email?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{ref.user?.name || 'Anonymous User'}</p>
                        <p className="text-sm text-gray-600">{maskEmail(ref.user?.email)}</p>
                        <p className="text-xs text-gray-500">
                          Joined: {new Date(ref.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    {ref.onboardingCompleted && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">+{ref.pointsAwarded} points</p>
                        <p className="text-xs text-gray-500">Points earned</p>
                      </div>
                    )}
                    
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        ref.onboardingCompleted 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ref.onboardingCompleted ? 'Completed' : '⏳ Pending'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {ref.onboardingCompleted ? 'Onboarding done' : 'Waiting for onboarding'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">How Referrals Work</h2>
              <p className="text-gray-600">Everything you need to know about our referral system</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">For You (Referrer):</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>Share your unique referral code or link with friends</li>
                <li>When they sign up using your code, they appear in your dashboard</li>
                <li>Once they complete onboarding, you earn <strong>5 points (5 additional scans)</strong></li>
                <li>Track all your referrals and earnings in real-time</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">For Your Friends:</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>They sign up using your referral code</li>
                <li>They get the same standard benefits as any new user</li>
                <li>They receive 20 scans when they complete onboarding</li>
                <li>Everyone wins!</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
            <h4 className="font-semibold text-blue-900 mb-4">💡 Pro Tips:</h4>
            <ul className="list-disc list-inside text-blue-800 text-sm space-y-2">
              <li>Share your referral link on social media for maximum reach</li>
              <li>Explain the benefits of Smellify to encourage sign-ups</li>
              <li>Follow up with friends to help them complete onboarding</li>
              <li>Keep your referral code active to continue earning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referral;