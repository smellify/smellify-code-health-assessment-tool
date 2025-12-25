import { useState, useEffect } from "react";
import api from "../services/api";
import { useNotification } from '../components/NotificationPopup';

export default function SessionManagement() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { showNotification } = useNotification();

  // Load active sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setMessage({
        text: "Failed to load active sessions",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDeviceInfo = (session) => {
    const { deviceInfo, userAgent } = session;
    
    if (deviceInfo?.browser && deviceInfo?.os) {
      return `${deviceInfo.browser} on ${deviceInfo.os}`;
    }
    
    // Fallback to parsing user agent
    if (userAgent) {
      if (userAgent.includes('Chrome')) return 'Chrome Browser';
      if (userAgent.includes('Firefox')) return 'Firefox Browser';
      if (userAgent.includes('Safari')) return 'Safari Browser';
      if (userAgent.includes('Edge')) return 'Edge Browser';
    }
    
    return 'Unknown Device';
  };

  const getDeviceIcon = (session) => {
    if (session.deviceInfo?.isMobile) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  const handleLogoutSpecific = async (sessionId) => {
    try {
      setActionLoading(prev => ({ ...prev, [sessionId]: true }));
      
      await api.delete(`/users/sessions/${sessionId}`);
      
      // Remove from local state
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      
      setMessage({
        text: "Device logged out successfully",
        type: "success"
      });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      showNotification('success', 'Device logged out successfully');
    } catch (error) {
      console.error('Logout specific session failed:', error);
      setMessage({
        text: error.response?.data?.message || "Failed to logout device",
        type: "error"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleLogoutAllOthers = async () => {
    try {
      setActionLoading(prev => ({ ...prev, logoutOthers: true }));
      
      const response = await api.post('/users/logout-all-others');
      
      // Refresh sessions list
      await loadSessions();
      
      setMessage({
        text: response.data.message,
        type: "success"
      });
      showNotification('success', 'All other sessions logged out successfully!');
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
      
    } catch (error) {
      console.error('Logout all others failed:', error);
      setMessage({
        text: error.response?.data?.message || "Failed to logout other devices",
        type: "error"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, logoutOthers: false }));
    }
  };

  const handleLogoutEverywhere = async () => {
    try {
      setActionLoading(prev => ({ ...prev, logoutEverywhere: true }));
      
      await api.post('/users/logout-everywhere');
      
      // Clear local storage and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Show success message briefly before redirect
      setMessage({
        text: "Logged out from all devices successfully",
        type: "success"
      });
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } catch (error) {
      console.error('Logout everywhere failed:', error);
      setMessage({
        text: error.response?.data?.message || "Failed to logout from all devices",
        type: "error"
      });
      setActionLoading(prev => ({ ...prev, logoutEverywhere: false }));
    }
  };

  const formatLastActive = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold text-gray-900">Active Sessions</h2>
            <p className="text-gray-600">Manage your active login sessions across devices</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleLogoutAllOthers}
            disabled={actionLoading.logoutOthers || sessions.filter(s => !s.isCurrent).length === 0}
            className="bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {actionLoading.logoutOthers ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Logging out...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Terminate other sessions
              </>
            )}
          </button>
          
          {/* <button
            onClick={() => setShowLogoutModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log out everywhere
          </button> */}
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No active sessions found
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.sessionId}
              className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                session.isCurrent
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${
                    session.isCurrent ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getDeviceIcon(session)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-900">
                        {formatDeviceInfo(session)}
                      </h3>
                      {session.isCurrent && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Current Session
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <strong>Last active:</strong> {formatLastActive(session.lastActive)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>IP Address:</strong> {session.ipAddress}
                      </p>
                      {session.location && session.location !== 'Unknown' && (
                        <p className="text-sm text-gray-600">
                          <strong>Location:</strong> {session.location}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <strong>Started:</strong> {new Date(session.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                {!session.isCurrent && (
                  <button
                    onClick={() => handleLogoutSpecific(session.sessionId)}
                    disabled={actionLoading[session.sessionId]}
                    className="bg-red-100 text-red-700 px-4 py-2 rounded-xl hover:bg-red-200 transition-colors duration-200 disabled:opacity-50 flex items-center"
                  >
                    {actionLoading[session.sessionId] ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-700 border-t-transparent mr-2"></div>
                        Logging out...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        End Session
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistics */}
      <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700 font-medium">
            Total active sessions: {sessions.length}
          </span>
          <span className="text-blue-600">
            Other sessions: {sessions.filter(s => !s.isCurrent).length}
          </span>
        </div>
      </div>

      {/* Logout Everywhere Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Log Out Everywhere?</h3>
              <p className="text-gray-600">
                This will log you out from all devices including this one. You'll need to log in again.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={actionLoading.logoutEverywhere}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutEverywhere}
                disabled={actionLoading.logoutEverywhere}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {actionLoading.logoutEverywhere ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Logging out...
                  </>
                ) : (
                  'Yes, Log Out Everywhere'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}