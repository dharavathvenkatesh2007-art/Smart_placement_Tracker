import React, { useState, useEffect } from 'react';
import axios from 'axios';
import commonStyles from '../style/common';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/notification/my-notifications`,
        { headers }
      );

      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(
        `${import.meta.env.VITE_API_URL}/notification/${notificationId}/read`,
        {},
        { headers }
      );

      setNotifications(
        notifications.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/notification/${notificationId}`,
        { headers }
      );

      setNotifications(notifications.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      application: '📄',
      status: '✓',
      drive: '📢',
      interview: '🎤',
      message: '💬',
    };
    return icons[type] || '🔔';
  };

  if (isLoading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className={commonStyles.container + ' py-10'}>
      <h1 className={commonStyles.heading.h1}>Notifications</h1>

      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`${commonStyles.card} ${
                !notification.read ? 'border-l-4 border-blue-500 bg-blue-50' : ''
              }`}
            >
              <div className={commonStyles.flexBetween}>
                <div className="flex items-start gap-4 flex-1">
                  <span className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div>
                    <h3 className={commonStyles.heading.h4}>
                      {notification.title}
                    </h3>
                    <p className="text-gray-700 mb-2">
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className={commonStyles.button.secondary}
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className={commonStyles.button.danger}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={commonStyles.card + ' text-center py-10'}>
          <p className="text-gray-600 text-lg">No notifications</p>
          <p className="text-gray-500">You're all caught up!</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
