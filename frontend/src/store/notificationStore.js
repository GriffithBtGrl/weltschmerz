import { create } from 'zustand';
import { notificationsApi } from '../services/api';

const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchUnreadCount: async () => {
    try {
      const { data } = await notificationsApi.getUnread();
      set({ unreadCount: data.count });
    } catch {}
  },

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const { data } = await notificationsApi.getAll();
      set({ notifications: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  readAll: async () => {
    try {
      await notificationsApi.readAll();
      set((state) => ({
        unreadCount: 0,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      }));
    } catch {}
  },

  readOne: async (id) => {
    try {
      await notificationsApi.readOne(id);
      set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {}
  },
}));

export default useNotificationStore;