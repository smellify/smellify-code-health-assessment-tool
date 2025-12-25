// components/TwoFactorAuth.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../components/NotificationPopup';

const TwoFactorAuth = () => {
  const { showNotification } = useNotification();
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    enabled: false,
    enabledAt: null,
    loading: true
  });
  
  const [setupModal, setSetupModal] = useState({
    isOpen: false,
    step: 'setup', // 'setup', 'verify', 'backup-codes', 'success'
    qrCode: '',
    secret: '',
    manualEntryKey: '',
    verificationCode: '',
    backupCodes: [],
    isLoading: false,
    error: '',
    errorType: ''
  });
  
  const [disableModal, setDisableModal] = useState({
    isOpen: false,
    verificationCode: '',
    isLoading: false,
    error: '',
    errorType: ''
  });

  const [manageModal, setManageModal] = useState({
    isOpen: false
  });

  const [regenerateModal, setRegenerateModal] = useState({
    isOpen: false,
    verificationCode: '',
    newBackupCodes: [],
    isLoading: false,
    error: '',
    errorType: '',
    step: 'verify' // 'verify', 'codes'
  });

  // Load 2FA status on component mount
  useEffect(() => {
    load2FAStatus();
  }, []);

  const load2FAStatus = async () => {
    try {
      const response = await api.get('/2fa/status');
      setTwoFactorStatus({
        enabled: response.data.enabled,
        enabledAt: response.data.enabledAt,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load 2FA status:', error);
      setTwoFactorStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleEnable2FA = async () => {
    setSetupModal({
      isOpen: true,
      step: 'setup',
      qrCode: '',
      secret: '',
      manualEntryKey: '',
      verificationCode: '',
      backupCodes: [],
      isLoading: true,
      error: '',
      errorType: ''
    });

    // WARNING NOTIFICATION
    showNotification('warning', 'Make sure you have an authenticator app ready before proceeding.');

    try {
      const response = await api.post('/2fa/setup');
      
      setSetupModal(prev => ({
        ...prev,
        step: 'verify',
        qrCode: response.data.qrCode,
        secret: response.data.secret,
        manualEntryKey: response.data.manualEntryKey,
        isLoading: false
      }));
      
      // SUCCESS NOTIFICATION
      showNotification('success', '2FA setup initialized. Scan the QR code with your authenticator app.');
    } catch (error) {
      console.error('2FA setup failed:', error);
      setSetupModal(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to setup 2FA. Please try again.',
        errorType: 'error'
      }));
      
      // ERROR NOTIFICATION
      showNotification('error', 'Failed to initialize 2FA setup. Please try again.');
    }
  };

  const handleVerifyAndEnable = async () => {
    if (setupModal.verificationCode.length !== 6) {
      setSetupModal(prev => ({
        ...prev,
        error: 'Please enter a valid 6-digit code',
        errorType: 'error'
      }));
      
      // WARNING NOTIFICATION
      showNotification('warning', 'Please enter a valid 6-digit verification code.');
      return;
    }

    setSetupModal(prev => ({ ...prev, isLoading: true, error: '', errorType: '' }));

    try {
      const response = await api.post('/2fa/enable', {
        token: setupModal.verificationCode
      });

      setSetupModal(prev => ({
        ...prev,
        step: 'backup-codes',
        backupCodes: response.data.backupCodes,
        isLoading: false,
        error: '2FA has been successfully enabled!',
        errorType: 'success'
      }));

      // SUCCESS NOTIFICATION
      showNotification('success', '2FA enabled successfully! Save your backup codes safely.');

      // Update status
      await load2FAStatus();
    } catch (error) {
      console.error('2FA enable failed:', error);
      setSetupModal(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Invalid code. Please try again.',
        errorType: 'error'
      }));
      
      // ERROR NOTIFICATION
      showNotification('error', 'Invalid verification code. Please check your authenticator app.');
    }
  };

  const handleDisable2FA = async () => {
    if (disableModal.verificationCode.length !== 6) {
      setDisableModal(prev => ({
        ...prev,
        error: 'Please enter a valid 6-digit backup code',
        errorType: 'error'
      }));
      
      // WARNING NOTIFICATION
      showNotification('warning', 'Please enter a valid 6-digit backup code or authenticator code.');
      return;
    }

    setDisableModal(prev => ({ ...prev, isLoading: true, error: '', errorType: '' }));

    try {
      await api.post('/2fa/disable', {
        token: disableModal.verificationCode
      });

      setDisableModal(prev => ({
        ...prev,
        isLoading: false,
        error: '2FA has been successfully disabled.',
        errorType: 'success'
      }));

      // SUCCESS NOTIFICATION
      showNotification('success', '2FA has been successfully disabled!');

      // Update status and close modal after delay
      setTimeout(async () => {
        await load2FAStatus();
        closeDisableModal();
        closeManageModal();
      }, 2000);

    } catch (error) {
      console.error('2FA disable failed:', error);
      setDisableModal(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Invalid backup code. Please try again.',
        errorType: 'error'
      }));
      
      // ERROR NOTIFICATION
      showNotification('error', 'Invalid backup code or authenticator code. Please try again.');
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (regenerateModal.verificationCode.length !== 6) {
      setRegenerateModal(prev => ({
        ...prev,
        error: 'Please enter a valid 6-digit code',
        errorType: 'error'
      }));
      
      // WARNING NOTIFICATION
      showNotification('warning', 'Please enter a valid 6-digit authenticator code.');
      return;
    }

    setRegenerateModal(prev => ({ ...prev, isLoading: true, error: '', errorType: '' }));

    try {
      const response = await api.post('/2fa/regenerate-backup-codes', {
        token: regenerateModal.verificationCode
      });

      setRegenerateModal(prev => ({
        ...prev,
        step: 'codes',
        newBackupCodes: response.data.backupCodes,
        isLoading: false,
        error: 'New backup codes generated successfully!',
        errorType: 'success'
      }));

      // SUCCESS NOTIFICATION
      showNotification('success', 'New backup codes generated successfully! Download them now.');

    } catch (error) {
      console.error('Regenerate backup codes failed:', error);
      setRegenerateModal(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Invalid code. Please try again.',
        errorType: 'error'
      }));
      
      // ERROR NOTIFICATION
      showNotification('error', 'Failed to regenerate backup codes. Please check your authenticator code.');
    }
  };

  const closeSetupModal = () => {
    setSetupModal({
      isOpen: false,
      step: 'setup',
      qrCode: '',
      secret: '',
      manualEntryKey: '',
      verificationCode: '',
      backupCodes: [],
      isLoading: false,
      error: '',
      errorType: ''
    });
  };

  const closeDisableModal = () => {
    setDisableModal({
      isOpen: false,
      verificationCode: '',
      isLoading: false,
      error: '',
      errorType: ''
    });
  };

  const openDisableModal = () => {
    setDisableModal({
      isOpen: true,
      verificationCode: '',
      isLoading: false,
      error: '',
      errorType: ''
    });
    
    // WARNING NOTIFICATION
    showNotification('warning', 'Disabling 2FA will reduce your account security!');
  };

  const closeManageModal = () => {
    setManageModal({
      isOpen: false
    });
  };

  const openManageModal = () => {
    setManageModal({
      isOpen: true
    });
  };

  const closeRegenerateModal = () => {
    setRegenerateModal({
      isOpen: false,
      verificationCode: '',
      newBackupCodes: [],
      isLoading: false,
      error: '',
      errorType: '',
      step: 'verify'
    });
  };

  const openRegenerateModal = () => {
    setRegenerateModal({
      isOpen: true,
      verificationCode: '',
      newBackupCodes: [],
      isLoading: false,
      error: '',
      errorType: '',
      step: 'verify'
    });
    closeManageModal();
    
    // WARNING NOTIFICATION
    showNotification('warning', 'Regenerating backup codes will invalidate all existing backup codes!');
  };

  const openDisableFromManage = () => {
    openDisableModal();
    closeManageModal();
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      
      // SUCCESS NOTIFICATION
      showNotification('success', 'Copied to clipboard successfully!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      
      // ERROR NOTIFICATION
      showNotification('error', 'Failed to copy to clipboard. Please copy manually.');
    }
  };

  const downloadBackupCodes = (codes = setupModal.backupCodes) => {
    try {
      const codesText = codes.join('\n');
      const blob = new Blob([`${process.env.REACT_APP_NAME || 'Smellify'} 2FA Backup Codes\n\n${codesText}\n\nKeep these codes safe! Each can only be used once.`], 
        { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '2fa-backup-codes.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // SUCCESS NOTIFICATION
      showNotification('success', 'Backup codes downloaded successfully! Store them in a safe place.');
    } catch (error) {
      console.error('Failed to download backup codes:', error);
      
      // ERROR NOTIFICATION
      showNotification('error', 'Failed to download backup codes. Please copy them manually.');
    }
  };

  if (twoFactorStatus.loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
        <div>
          <p className="font-semibold text-gray-900">Two-Factor Authentication</p>
          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          {twoFactorStatus.enabled && (
            <p className="text-sm text-green-600 mt-1">✓ 2FA is enabled</p>
          )}
        </div>
        <button
          onClick={twoFactorStatus.enabled ? openManageModal : handleEnable2FA}
          className={`px-4 py-2 rounded-xl font-medium transition-colors duration-200 ${
            twoFactorStatus.enabled 
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {twoFactorStatus.enabled ? 'Manage 2FA' : 'Setup 2FA'}
        </button>
      </div>

      {/* Manage 2FA Modal */}
      {manageModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manage 2FA</h3>
              <p className="text-gray-600">Choose an action to manage your two-factor authentication</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={openRegenerateModal}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generate New Backup Codes
              </button>
              
              <button
                onClick={openDisableFromManage}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Disable 2FA
              </button>
            </div>

            <div className="mt-6">
              <button
                onClick={closeManageModal}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes Modal */}
      {regenerateModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            
            {/* Verify Step */}
            {regenerateModal.step === 'verify' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Generate New Backup Codes</h3>
                  <p className="text-gray-600">Enter your authenticator code to generate new backup codes</p>
                </div>

                {/* Error/Success message */}
                {regenerateModal.error && (
                  <div className={`mb-4 p-3 rounded-xl text-sm ${
                    regenerateModal.errorType === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {regenerateModal.error}
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Enter a 6-digit code from your authenticator app:
                  </label>
                  <input
                    type="text"
                    value={regenerateModal.verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setRegenerateModal(prev => ({ ...prev, verificationCode: value, error: '', errorType: '' }));
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                    placeholder="123456"
                    maxLength="6"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && regenerateModal.verificationCode.length === 6 && handleRegenerateBackupCodes()}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={closeRegenerateModal}
                    disabled={regenerateModal.isLoading}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegenerateBackupCodes}
                    disabled={regenerateModal.verificationCode.length !== 6 || regenerateModal.isLoading}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {regenerateModal.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      'Generate Codes'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* New Backup Codes Step */}
            {regenerateModal.step === 'codes' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">New Backup Codes Generated!</h3>
                  <p className="text-gray-600">Save these new backup codes - your old codes are no longer valid</p>
                </div>

                {/* Success message */}
                {regenerateModal.error && regenerateModal.errorType === 'success' && (
                  <div className="mb-4 p-3 rounded-xl text-sm bg-green-50 border border-green-200 text-green-800">
                    {regenerateModal.error}
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-yellow-800 font-semibold text-sm">Important!</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        Your previous backup codes have been invalidated. Store these new codes safely.
                      </p>
                    </div>
                  </div>
                </div>

                {/* New Backup Codes */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Your New Backup Codes:</h4>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {regenerateModal.newBackupCodes.map((code, index) => (
                      <div key={index} className="bg-white px-3 py-2 rounded-lg border border-gray-200 font-mono text-sm text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => downloadBackupCodes(regenerateModal.newBackupCodes)}
                    className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    📥 Download Backup Codes
                  </button>
                </div>

                <button
                  onClick={closeRegenerateModal}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Setup Modal */}
      {setupModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            
            {/* Setup Step */}
            {setupModal.step === 'setup' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {setupModal.isLoading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                  ) : (
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Setting up 2FA...</h3>
                <p className="text-gray-600">Please wait while we generate your QR code</p>
              </div>
            )}

            {/* Verify Step */}
            {setupModal.step === 'verify' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 4L9.5 6.5l1.41 1.41L12 6.83l1.09 1.08L14.5 6.5 12 4z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Scan QR Code</h3>
                  <p className="text-gray-600">Use your authenticator app to scan this QR code</p>
                </div>

                {/* Error/Success message */}
                {setupModal.error && (
                  <div className={`mb-4 p-3 rounded-xl text-sm ${
                    setupModal.errorType === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {setupModal.error}
                  </div>
                )}

                {/* QR Code */}
                <div className="text-center mb-6">
                  <div className="bg-white p-4 rounded-xl border-2 border-gray-200 inline-block">
                    <img src={setupModal.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                </div>

                {/* Manual Entry */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Can't scan? Enter this code manually:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={setupModal.manualEntryKey}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(setupModal.manualEntryKey)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Verification Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Enter the 6-digit code from your authenticator app:
                  </label>
                  <input
                    type="text"
                    value={setupModal.verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setSetupModal(prev => ({ ...prev, verificationCode: value, error: '', errorType: '' }));
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                    placeholder="123456"
                    maxLength="6"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && setupModal.verificationCode.length === 6 && handleVerifyAndEnable()}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={closeSetupModal}
                    disabled={setupModal.isLoading}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyAndEnable}
                    disabled={setupModal.verificationCode.length !== 6 || setupModal.isLoading}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {setupModal.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      'Enable 2FA'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Backup Codes Step */}
            {setupModal.step === 'backup-codes' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">2FA Enabled Successfully!</h3>
                  <p className="text-gray-600">Save these backup codes - you'll need them if you lose your phone</p>
                </div>

                {/* Success message */}
                {setupModal.error && setupModal.errorType === 'success' && (
                  <div className="mb-4 p-3 rounded-xl text-sm bg-green-50 border border-green-200 text-green-800">
                    {setupModal.error}
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-yellow-800 font-semibold text-sm">Important!</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        Store these backup codes safely. Each code can only be used once to access your account if you lose your authenticator app.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Backup Codes */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Your Backup Codes:</h4>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {setupModal.backupCodes.map((code, index) => (
                      <div key={index} className="bg-white px-3 py-2 rounded-lg border border-gray-200 font-mono text-sm text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => downloadBackupCodes()}
                    className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    📥 Download Backup Codes
                  </button>
                </div>

                <button
                  onClick={closeSetupModal}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {disableModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Disable Two-Factor Authentication</h3>
              <p className="text-gray-600">
                Your account will be less secure without 2FA protection
              </p>
            </div>

            {/* Error/Success message */}
            {disableModal.error && (
              <div className={`mb-4 p-3 rounded-xl text-sm ${
                disableModal.errorType === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {disableModal.error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Enter a 6-digit backup code to disable 2FA:
              </label>
              <input
                type="text"
                value={disableModal.verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 6);
                  setDisableModal(prev => ({ ...prev, verificationCode: value.toUpperCase(), error: '', errorType: '' }));
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                placeholder="ABC123"
                maxLength="6"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && disableModal.verificationCode.length === 6 && handleDisable2FA()}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Use one of your backup codes to disable 2FA
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeDisableModal}
                disabled={disableModal.isLoading}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDisable2FA}
                disabled={disableModal.verificationCode.length !== 6 || disableModal.isLoading}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {disableModal.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Disabling...
                  </>
                ) : (
                  'Disable 2FA'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TwoFactorAuth;