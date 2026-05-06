import { create } from 'zustand';
import { authApi } from '../services/api';

const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authApi.login(credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Error al iniciar sesión', loading: false });
      throw err;
    }
  },

  register: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authApi.register(credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Error al registrarse', loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;