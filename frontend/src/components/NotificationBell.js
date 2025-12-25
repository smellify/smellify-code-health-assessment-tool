import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, CheckCheck, Trash2, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import api from '../services/api';

const NotificationBell = ({ showNotification }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications when component mounts or dropdown opens
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications/dashboard?limit=20');
     //const response = await api.get('/notifications/dashboard?limit=20');
      const notificationData = response.data.notifications || [];
      setNotifications(notificationData);
      
      // Count unread notifications
      const unreadNotifications = notificationData.filter(n => !n.read);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showNotification('error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/read/${notificationId}`);
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showNotification('error', 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    

    try {
      // Delete all notifications one by one (since there's no bulk delete endpoint)
      const deletePromises = notifications.map(notification =>
        api.delete(`/notifications/${notification._id}`)
      );
      
      await Promise.all(deletePromises);
      
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      // Refresh to get current state
      fetchNotifications();
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      
      // Update local state
      const deletedNotification = notifications.find(n => n._id === notificationId);
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification._id !== notificationId)
      );
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      showNotification('error', 'Failed to delete notification');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => {
          setIsDropdownOpen(!isDropdownOpen);
          if (!isDropdownOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Notifications ({unreadCount} unread)
              </h3>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Action Buttons */}
            {notifications.length > 0 && (
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={markAllAsRead}
                  className="flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark all read
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="flex items-center px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                <span className="ml-2 text-sm text-gray-500">Loading...</span>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`px-4 py-3 transition-colors ${
                      notification.read ? 'bg-white' : 'bg-sky-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Notification Icon */}
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 break-words">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-1">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                            title="Mark as read"
                          >
                            <CheckCheck className="w-3 h-3 mr-1" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="flex items-center px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                          title="Clear notification"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;