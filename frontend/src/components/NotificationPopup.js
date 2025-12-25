//components/NotificationPopup.js
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import api from '../services/api';

// Context for managing multiple notifications
const NotificationContext = createContext();

// Provider component to manage the notification queue
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [preferencesError, setPreferencesError] = useState(false);
  const preferencesLoadedRef = useRef(false);

  // Load preferences on mount
  useEffect(() => {
    fetchUserPreferences();
  }, []);

  // Listen for preference updates from other parts of the app
  useEffect(() => {
    const handlePreferenceUpdate = (event) => {
      if (event.detail) {
        setUserPreferences(event.detail);
      }
    };

    window.addEventListener('notificationPreferencesUpdated', handlePreferenceUpdate);
    return () => {
      window.removeEventListener('notificationPreferencesUpdated', handlePreferenceUpdate);
    };
  }, []);

  const fetchUserPreferences = async () => {
    try {
      const response = await api.get('/notifications/preferences');
      setUserPreferences(response.data);
      setPreferencesError(false);
      preferencesLoadedRef.current = true;
    } catch (error) {
      setPreferencesError(true);
      preferencesLoadedRef.current = true;
      
      if (error.response?.status === 401) {
        setUserPreferences(null);
      } else {
        setUserPreferences(null);
      }
    }
  };

  const addNotification = (type, message, duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      message,
      duration,
      createdAt: Date.now()
    };

    setNotifications(prev => [notification, ...prev]);
    
    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Refresh preferences method
  const refreshPreferences = () => {
    fetchUserPreferences();
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      userPreferences, 
      preferencesError, 
      preferencesLoaded: preferencesLoadedRef.current,
      addNotification, 
      removeNotification,
      refreshPreferences
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Container to render all notifications
const NotificationContainer = () => {
  const { notifications } = useContext(NotificationContext);

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none space-y-2">
      {notifications.map((notification, index) => (
        <NotificationPopup 
          key={notification.id} 
          {...notification} 
          index={index}
        />
      ))}
    </div>
  );
};

// Individual notification component
const NotificationPopup = ({ 
  id,
  type = 'info', 
  message = '', 
  duration = 5000,
  index = 0
}) => {
  const { userPreferences, preferencesError, preferencesLoaded, removeNotification } = useContext(NotificationContext);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  
  const progressIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const hasStoredRef = useRef(false);  // Use ref instead of state to prevent re-renders

  // Handle showing and storing logic
  useEffect(() => {
    if (!preferencesLoaded) {
      return; // Wait for preferences to load
    }

    let effectivePreferences = userPreferences;
    
    // If we have an error and no preferences, use fallback
    if (preferencesError && !userPreferences) {
      effectivePreferences = {
        dashboardNotifications: true, // Don't store on unauthenticated pages
        popupNotifications: true,      // But show popups for feedback
        newsletterEmails: false
      };
    }

    // Store in database if dashboard notifications are enabled
    if (effectivePreferences?.dashboardNotifications && !hasStoredRef.current) {
      hasStoredRef.current = true;  // Set flag immediately to prevent duplicates
      storeNotificationInDB();
    }

    // Show popup only if popup notifications are enabled
    if (effectivePreferences?.popupNotifications) {
      timeoutRef.current = setTimeout(() => setIsVisible(true), 100 + (index * 50));
      
      // Start progress bar animation
      setProgress(100);
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const decrement = 100 / (duration / 100);
          const newProgress = prev - decrement;
          if (newProgress <= 0) {
            clearInterval(progressIntervalRef.current);
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, 100);
    } else {
      // If popups are disabled, remove immediately
      removeNotification(id);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [preferencesLoaded, userPreferences, preferencesError, id, index, duration]);

  const storeNotificationInDB = async () => {
    try {
      await api.post('/notifications/store', {
        type,
        message
      });
    } catch (error) {
      // Silently fail for storage errors
    }
  };

  const handleClose = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsVisible(false);
    setTimeout(() => {
      removeNotification(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          progress: 'bg-green-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          progress: 'bg-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          progress: 'bg-yellow-500'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          progress: 'bg-blue-500'
        };
    }
  };

  // Don't render if preferences haven't loaded yet
  if (!preferencesLoaded) {
    return null;
  }

  // Check if popups should be shown
  let shouldShowPopup = true;
  if (userPreferences) {
    shouldShowPopup = userPreferences.popupNotifications;
  } else if (preferencesError) {
    shouldShowPopup = true; // Show on login/unauthenticated pages
  }

  if (!shouldShowPopup) {
    return null;
  }

  const colors = getColorClasses();

  return (
    <div className="pointer-events-auto">
      <div
        className={`
          w-96 max-w-sm ${colors.bg} ${colors.border} border rounded-2xl shadow-lg overflow-hidden
          transform transition-all duration-300 ease-in-out
          ${isVisible 
            ? 'translate-x-0 opacity-100 scale-100' 
            : 'translate-x-full opacity-0 scale-95'
          }
        `}
        style={{
          animationDelay: `${index * 50}ms`
        }}
      >
        {/* Main Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {getIcon()}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 break-words">
                {message}
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={handleClose}
                className="bg-white rounded-md p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full ${colors.progress} transition-all ease-linear`}
            style={{
              width: `${progress}%`,
              transitionDuration: '100ms'
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Hook to use notifications throughout your app
export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  const { addNotification, refreshPreferences } = context;

  const showNotification = (type, message, duration = 5000) => {
    return addNotification(type, message, duration);
  };

  return {
    showNotification,
    refreshPreferences
  };
};

// Utility function to update preferences and notify the system
export const updateNotificationPreferences = (newPreferences) => {
  // Dispatch custom event to update preferences across the app
  const event = new CustomEvent('notificationPreferencesUpdated', {
    detail: newPreferences
  });
  window.dispatchEvent(event);
};

// Example usage component
const ExampleUsage = () => {
  const { showNotification } = useNotification();

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Notification Examples</h2>
      
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => showNotification('success', 'Profile updated successfully!')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Show Success
        </button>
        
        <button
          onClick={() => showNotification('error', 'Something went wrong. Please try again.')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Show Error
        </button>
        
        <button
          onClick={() => showNotification('warning', 'Your session will expire in 5 minutes.')}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          Show Warning
        </button>
        
        <button
          onClick={() => showNotification('info', 'New features are now available!')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Show Info
        </button>

        <button
          onClick={() => {
            showNotification('info', 'First notification');
            setTimeout(() => showNotification('success', 'Second notification'), 500);
            setTimeout(() => showNotification('warning', 'Third notification'), 1000);
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Show Multiple
        </button>
      </div>
    </div>
  );
};

export default NotificationPopup;

/*
showNotification('success', 'Action completed!');
showNotification('error', 'error occurred!');
showNotification('warning', 'warning!');
*/