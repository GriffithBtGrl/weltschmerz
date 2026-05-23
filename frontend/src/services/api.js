import axios from "axios";

// Instancia base de axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

// Adjunta token si existe, o anonymous_id si no hay sesión
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    const anonId = localStorage.getItem("anonymous_id");
    if (anonId) config.headers["X-Anonymous-Id"] = anonId;
  }
  return config;
});

// Cierra sesión automáticamente si el token expira
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

// Posts: obtener todos, uno, crear, editar, eliminar
export const postsApi = {
  getAll:  (params)    => api.get("/posts", { params }),
  getOne:  (id)        => api.get(`/posts/${id}`),
  create:  (data)      => api.post("/posts", data),
  update:  (id, data)  => api.patch(`/posts/${id}`, data),
  delete:  (id)        => api.delete(`/posts/${id}`),
};

// Comentarios: obtener, crear, editar, eliminar
export const commentsApi = {
  getAll:  (postId)       => api.get(`/posts/${postId}/comments`),
  create:  (postId, data) => api.post(`/posts/${postId}/comments`, data),
  delete:  (id)           => api.delete(`/comments/${id}`),
  update:  (id, content)  => api.patch(`/comments/${id}`, { content }),
};

// Votos: votar en post o comentario
export const votesApi = {
  vote: (type, id, value) => api.post(`/votes/${type}/${id}`, { value }),
};

// Auth: registro, login, obtener usuario actual
export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login:    (data) => api.post("/auth/login", data),
  me:       ()     => api.get("/auth/me"),
};

// Upload: subir imagen a Cloudinary
export const uploadApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Usuarios: perfil, perfil anónimo, editar bio y avatar
export const usersApi = {
  getProfile:     (username) => api.get(`/users/${username}`),
  getAnonProfile: (anonId)   => api.get(`/users/anon/${anonId}`),
  updateBio:      (bio)      => api.patch("/users/me/bio", { bio }),
  updateAvatar:   (file)     => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.patch("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Admin: stats, posts, usuarios, comentarios, moderar
export const adminApi = {
  getStats:      ()    => api.get("/admin/stats"),
  getPosts:      ()    => api.get("/admin/posts"),
  getUsers:      ()    => api.get("/admin/users"),
  getComments:   ()    => api.get("/admin/comments"),
  deletePost:    (id)  => api.delete(`/admin/posts/${id}`),
  deleteComment: (id)  => api.delete(`/admin/comments/${id}`),
  pinPost:       (id)  => api.patch(`/admin/posts/${id}/pin`),
};

// Notificaciones
export const notificationsApi = {
  getAll:      ()    => api.get('/notifications'),
  getUnread:   ()    => api.get('/notifications/unread-count'),
  readAll:     ()    => api.patch('/notifications/read-all'),
  readOne:     (id)  => api.patch(`/notifications/${id}/read`),
};

export default api;