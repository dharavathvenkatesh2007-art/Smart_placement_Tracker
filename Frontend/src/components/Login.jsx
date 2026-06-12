import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import commonStyles from '../style/common';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error, clearError } = useAuthStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(formData.email, formData.password);
      
      let dashboardPath = '/student-dashboard';
      if (response.role === 'company') {
        dashboardPath = '/company-dashboard';
      } else if (response.role === 'admin') {
        dashboardPath = '/admin-dashboard';
      }
      
      sessionStorage.setItem('flashMessage', JSON.stringify({
        type: 'success',
        text: 'Login successfully.',
      }));
      window.location.replace(dashboardPath);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="grid gap-8 max-w-5xl w-full lg:grid-cols-[1.1fr_0.9fr] bg-white rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-600 to-sky-500 p-12 text-white">
          <div className="space-y-6">
            <div>
              <p className="uppercase tracking-[0.3em] text-sm font-semibold text-blue-100">Welcome back</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight">Sign in to your placement account</h2>
            </div>
            <p className="text-slate-100 leading-7">
              Access the dashboard for drives, applications, interviews and company updates. Students and recruiters both login here.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-200">Quick access</p>
                <p className="mt-3 text-lg font-semibold">Job search</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-200">Fast setup</p>
                <p className="mt-3 text-lg font-semibold">Profile management</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          <div className="mb-8">
            <h1 className={commonStyles.heading.h2}>Login to PlaceSense</h1>
            <p className="text-slate-600">Enter your credentials and continue with your campus placement activities.</p>
          </div>

          {error && (
            <div className={commonStyles.alert.error}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={commonStyles.formGroup}>
              <label className={commonStyles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={commonStyles.input}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className={commonStyles.formGroup}>
              <label className={commonStyles.label}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={commonStyles.input}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={commonStyles.button.primary + ' w-full'}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-600 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign up
            </Link>
          </p>

          
        </div>
      </div>
    </div>
  );
};

export default Login;
