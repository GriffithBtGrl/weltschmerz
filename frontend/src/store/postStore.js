import { create } from "zustand";
import { postsApi } from "../services/api";

const usePostStore = create((set, get) => ({
  posts: [],
  currentPost: null,
  loading: false,
  loadingMore: false,
  error: null,
  sort: "new",
  board: null,
  page: 1,
  hasMore: true,

  setSort: (sort) => set({ sort }),
  setBoard: (board) => set({ board }),
  resetPosts: () => set({ posts: [], page: 1, hasMore: true }),

  fetchPosts: async () => {
    set({ loading: true, error: null, posts: [], page: 1, hasMore: true });
    try {
      const { sort, board } = get();
      const { data } = await postsApi.getAll({
        sort,
        board,
        page: 1,
        limit: 15,
      });
      set({
        posts: data,
        loading: false,
        page: 1,
        hasMore: data.length === 15,
      });
    } catch (err) {
      set({
        error: err.response?.data?.error || "Error al cargar posts",
        loading: false,
      });
    }
  },

  fetchMorePosts: async () => {
    const { loadingMore, hasMore, posts, sort, board, page } = get();
    if (loadingMore || !hasMore) return;

    set({ loadingMore: true });
    try {
      const nextPage = page + 1;
      const { data } = await postsApi.getAll({
        sort,
        board,
        page: nextPage,
        limit: 15,
      });
      set({
        posts: [...posts, ...data],
        loadingMore: false,
        page: nextPage,
        hasMore: data.length === 15,
      });
    } catch (err) {
      set({ loadingMore: false });
    }
  },

  fetchPost: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await postsApi.getOne(id);
      set({ currentPost: data, loading: false });
    } catch (err) {
      set({
        error: err.response?.data?.error || "Post no encontrado",
        loading: false,
      });
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
        p.id === postId ? { ...p, vote_score: p.vote_score + delta } : p,
      ),
      currentPost:
        state.currentPost?.id === postId
          ? {
              ...state.currentPost,
              vote_score: state.currentPost.vote_score + delta,
            }
          : state.currentPost,
    }));
  },
}));

export default usePostStore;
