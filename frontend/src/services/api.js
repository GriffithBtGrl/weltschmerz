import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Adjuntar token automáticamente si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejar errores globalmente
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(err);
  }
);

// Posts
export const postsApi = {
  getAll: (params) => api.get('/posts', { params }),
  getOne: (id)     => api.get(`/posts/${id}`),
  create: (data)   => api.post('/posts', data),
  delete: (id)     => api.delete(`/posts/${id}`),
};

// Comments
export const commentsApi = {
  getAll: (postId)       => api.get(`/posts/${postId}/comments`),
  create: (postId, data) => api.post(`/posts/${postId}/comments`, data),
  delete: (id)           => api.delete(`/comments/${id}`),
};

// Votes
export const votesApi = {
  vote: (type, id, value) => api.post(`/votes/${type}/${id}`, { value }),
};

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
};

// Upload
export const uploadApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;