import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import commonStyles from '../style/common';
import useAuthStore from '../store/authStore';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, userRole, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/notification/my-notifications`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const notifications = response.data.notifications || [];
        setUnreadCount(notifications.filter((item) => !item.read).length);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    setUnreadCount(0);
    sessionStorage.setItem('flashMessage', JSON.stringify({
      type: 'success',
      text: 'Logged out successfully.',
    }));
    window.location.replace('/');
  };

  return (
    <nav className="bg-slate-900 shadow-lg sticky top-0 z-50">
      <div className={commonStyles.container + ' py-5'}>
        <div className="flex items-center justify-between">
          <Link to="/" className="text-3xl font-bold text-white tracking-tight">
            PlaceSense
          </Link>
          
          <button
            className="lg:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="w-6 h-0.5 bg-white"></span>
            <span className="w-6 h-0.5 bg-white"></span>
            <span className="w-6 h-0.5 bg-white"></span>
          </button>

          <div className="hidden lg:flex items-center gap-12">
            <div className="flex items-center gap-8 text-white">
              <Link to="/" className="font-medium hover:text-cyan-300 transition">Home</Link>
              {isAuthenticated && (
                <>
                  <Link
                    to={userRole === 'admin' ? '/admin-dashboard' : (userRole === 'student' ? '/student-dashboard' : '/company-dashboard')}
                    className="font-medium hover:text-cyan-300 transition "
                  >
                    Dashboard
                  </Link>
                  {userRole !== 'admin' && (
                    <>
                      <Link to="/drives" className="font-medium hover:text-cyan-300 transition">Drives</Link>
                      <Link to="/applications" className="font-medium hover:text-cyan-300 transition">Applications</Link>
                      <Link to="/schedules" className="font-medium hover:text-cyan-300 transition">Schedules</Link>
                    </>
                  )}
                  {userRole !== 'admin' && (
                    <Link to="/notifications" className="relative font-medium hover:text-cyan-300 transition">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="absolute -right-4 -top-2 min-w-5 rounded-full bg-cyan-400 px-1.5 py-0.5 text-center text-xs font-bold text-slate-950">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  )}
                  <Link to="/profile" className="font-medium hover:text-cyan-300 transition">Profile</Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className={commonStyles.button.danger}
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" className={commonStyles.button.secondary}>
                    Login
                  </Link>
                  <Link to="/register" className={commonStyles.button.primary}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="lg:hidden mt-6 pb-6 border-t border-slate-700 pt-6 space-y-4">
            <div className="flex flex-col gap-4 text-white">
              <Link to="/" className="font-medium">Home</Link>
              {isAuthenticated && (
                <>
                  <Link
                    to={userRole === 'admin' ? '/admin-dashboard' : (userRole === 'student' ? '/student-dashboard' : '/company-dashboard')}
                    className="font-medium text-cyan-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {userRole !== 'admin' && (
                    <>
                      <Link to="/drives" className="font-medium" onClick={() => setIsOpen(false)}>Drives</Link>
                      <Link to="/applications" className="font-medium" onClick={() => setIsOpen(false)}>Applications</Link>
                      <Link to="/schedules" className="font-medium" onClick={() => setIsOpen(false)}>Schedules</Link>
                      <Link to="/notifications" className="font-medium" onClick={() => setIsOpen(false)}>
                        Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
                      </Link>
                    </>
                  )}
                  <Link to="/profile" className="font-medium" onClick={() => setIsOpen(false)}>Profile</Link>
                </>
              )}
            </div>
            <div className="flex flex-col gap-3 pt-4">
              {isAuthenticated ? (
                <button onClick={handleLogout} className={commonStyles.button.danger + ' w-full'}>
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" className={commonStyles.button.secondary + ' text-center'}>
                    Login
                  </Link>
                  <Link to="/register" className={commonStyles.button.primary + ' text-center'}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
