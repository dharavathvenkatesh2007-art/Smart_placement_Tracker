import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import commonStyles from '../style/common';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    phone: '',
    company: '',
    college: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  const { register, isLoading, error, clearError } = useAuthStore();

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

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'confirmPassword') payload.append(key, value);
      });
      if (profileImage) payload.append('profileImage', profileImage);

      await register(payload);
      sessionStorage.setItem('flashMessage', JSON.stringify({
        type: 'success',
        text: 'Registered successfully. Please login to continue.',
      }));
      window.location.replace('/login');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="grid gap-8 max-w-6xl w-full lg:grid-cols-[1.1fr_0.9fr] bg-white rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="hidden lg:flex flex-col justify-center bg-slate-950 p-12 text-white">
          <div className="space-y-6">
            <p className="uppercase tracking-[0.3em] text-sm font-semibold text-slate-350">Start your placement journey</p>
            <h2 className="text-4xl font-bold tracking-tight">Register and get access to top drives</h2>
            <p className="text-slate-355 leading-7">
              Build your profile, apply to employer drives, and stay ahead with instant interview notifications.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300">For students</p>
                <p className="mt-3 text-lg font-semibold">Career-ready profiles</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300">For companies</p>
                <p className="mt-3 text-lg font-semibold">Candidate management</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          <div className="mb-8">
            <h1 className={commonStyles.heading.h2}>Create Account</h1>
            <p className="text-slate-600">Join PlaceSense to manage placements, drives, and applications efficiently.</p>
          </div>

          {error && (
            <div className={commonStyles.alert.error}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>I am a</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={commonStyles.input}
                >
                  <option value="student">Student</option>
                  <option value="company">Company</option>
                </select>
              </div>
            </div>

            <div className={commonStyles.formGroup}>
              <label className={commonStyles.label}>
                {formData.role === 'student' ? 'Full Name' : 'Company Name'}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={commonStyles.input}
                required
              />
            </div>

            <div className={commonStyles.formGroup}>
              <label className={commonStyles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={commonStyles.input}
                required
              />
            </div>

            <div className={commonStyles.formGroup}>
              <label className={commonStyles.label}>
                {formData.role === 'student' ? 'Profile Photo (JPG/PNG)' : 'Company Logo (JPG/PNG)'}
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                className={commonStyles.input + ' py-2.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={commonStyles.input}
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

              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={commonStyles.input}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={commonStyles.button.primary + ' w-full'}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-600 mt-8">
            Already have an account? {' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
