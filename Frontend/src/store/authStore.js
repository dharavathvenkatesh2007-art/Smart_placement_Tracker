// Auth Store - Zustand for state management
import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAuthStore = create((set) => ({
  // State
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  userRole: localStorage.getItem('userRole') || null, // 'student' or 'company'

  // Actions
  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  // Register
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/user/register`, userData);
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      delete axios.defaults.headers.common['Authorization'];

      set({
        token: null,
        user: null,
        userRole: null,
        isAuthenticated: false,
        isLoading: false,
      });

      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/user/login`, {
        email,
        password,
      });

      const { token, user, role } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);

      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({
        token,
        user,
        userRole: role,
        isAuthenticated: true,
        isLoading: false,
      });

      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    delete axios.defaults.headers.common['Authorization'];

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      userRole: null,
      error: null,
    });
  },

  // Get current user
  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get(`${API_URL}/user/me`);

      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return response.data.user;
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/user/profile`, userData);

      set({
        user: response.data.user,
        isLoading: false,
      });

      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Update failed';
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  // Check if authenticated
  checkAuth: () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (token && userRole) {
      set({
        token,
        userRole,
        isAuthenticated: true,
      });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },
}));

export default useAuthStore;
