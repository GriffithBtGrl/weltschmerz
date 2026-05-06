import { create } from 'zustand';
import { postsApi } from '../services/api';

const usePostStore = create((set, get) => ({
  posts: [],
  currentPost: null,
  loading: false,
  error: null,
  sort: 'new',
  board: null,

  setSort:  (sort)  => set({ sort }),
  setBoard: (board) => set({ board }),

  fetchPosts: async () => {
    set({ loading: true, error: null });
    try {
      const { sort, board } = get();
      const { data } = await postsApi.getAll({ sort, board });
      set({ posts: data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Error al cargar posts', loading: false });
    }
  },

  fetchPost: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await postsApi.getOne(id);
      set({ currentPost: data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Post no encontrado', loading: false });
    }
  },

  createPost: async (postData) => {
    const { data } = await postsApi.create(postData);
    set((state) => ({ posts: [data, ...state.posts] }));
    return data;
  },

  deletePost: async (id) => {
    await postsApi.delete(id);
    set((state) => ({ posts: state.posts.filter((p) => p.id !== id) }));
  },

  updateVoteScore: (postId, delta) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, vote_score: p.vote_score + delta } : p
      ),
      currentPost:
        state.currentPost?.id === postId
          ? { ...state.currentPost, vote_score: state.currentPost.vote_score + delta }
          : state.currentPost,
    }));
  },
}));

export default usePostStore;