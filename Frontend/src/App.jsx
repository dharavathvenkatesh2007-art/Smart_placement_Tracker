import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import Drives from './components/Drives';
import DriveDetails from './components/DriveDetails';
import Applications from './components/Applications';
import Notifications from './components/Notifications';
import Profile from './components/Profile';
import Schedule from './components/Schedule';
import AiChatbot from './components/AiChatbot';
import AdminDashboard from './components/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, userRole } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

const DashboardRedirect = () => {
  const { userRole } = useAuthStore();
  if (userRole === 'admin') return <Navigate to="/admin-dashboard" replace />;
  return <Navigate to={userRole === 'company' ? '/company-dashboard' : '/student-dashboard'} replace />;
};

const FlashMessage = () => {
  const location = useLocation();
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const storedMessage = sessionStorage.getItem('flashMessage');
    if (!storedMessage) return;

    setMessage(JSON.parse(storedMessage));
    sessionStorage.removeItem('flashMessage');

    const timer = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!message) return null;

  const colorClass = message.type === 'error'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-green-200 bg-green-50 text-green-700';

  return (
    <div className="fixed right-4 top-24 z-[60] max-w-sm rounded-2xl border bg-white px-5 py-4 shadow-xl">
      <div className={colorClass + ' rounded-xl border px-4 py-3 font-semibold'}>
        {message.text}
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <main className="flex-grow">
      <FlashMessage />
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
      
        {/* Protected Routes - Available for both roles */}
        <Route
          path="/drives"
          element={
            <ProtectedRoute>
              <Drives />
            </ProtectedRoute>
          }
        />
        <Route
          path="/drive/:driveId"
          element={
            <ProtectedRoute>
              <DriveDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedules"
          element={
            <ProtectedRoute>
              <Schedule />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Company Routes */}
        <Route
          path="/company-dashboard"
          element={
            <ProtectedRoute requiredRole="company">
              <CompanyDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </main>
  );
};

function App() {
  const { checkAuth, getCurrentUser, isLoading, isAuthenticated } = useAuthStore();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    getCurrentUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <AppRoutes />
        {isAuthenticated && <AiChatbot />}

        <Footer />
      </div>
    </Router>
  );
}

export default App;
