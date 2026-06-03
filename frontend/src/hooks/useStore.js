import { create } from 'zustand';
import api from '../utils/api';

// ---- Auth Store ----
export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('sp_user') || 'null'),
  token: localStorage.getItem('sp_token') || null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('sp_token', token);
    localStorage.setItem('sp_user', JSON.stringify(user));
    set({ token, user, loading: false });
    return user;
  },

  register: async (email, password, full_name) => {
    set({ loading: true });
    const res = await api.post('/auth/register', { email, password, full_name });
    const { token, user } = res.data;
    localStorage.setItem('sp_token', token);
    localStorage.setItem('sp_user', JSON.stringify(user));
    set({ token, user, loading: false });
    return user;
  },

  logout: () => {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
    set({ user: null, token: null });
  },

  refreshUser: async () => {
    try {
      const res = await api.get('/auth/me');
      const user = res.data.user;
      localStorage.setItem('sp_user', JSON.stringify(user));
      set({ user });
    } catch (_) {}
  },

  isAuthenticated: () => !!get().token,
}));

// ---- Workspace Store ----
export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: JSON.parse(localStorage.getItem('sp_workspace') || 'null'),
  loading: false,

  fetchWorkspaces: async () => {
    set({ loading: true });
    const res = await api.get('/workspaces');
    const workspaces = res.data.workspaces;
    set({ workspaces, loading: false });
    // Auto-select first workspace if none active
    if (!get().activeWorkspace && workspaces.length) {
      get().setActiveWorkspace(workspaces[0]);
    }
    return workspaces;
  },

  setActiveWorkspace: (workspace) => {
    localStorage.setItem('sp_workspace', JSON.stringify(workspace));
    set({ activeWorkspace: workspace });
  },

  createWorkspace: async (data) => {
    const res = await api.post('/workspaces', data);
    const workspace = res.data.workspace;
    set((s) => ({ workspaces: [...s.workspaces, workspace] }));
    get().setActiveWorkspace(workspace);
    return workspace;
  },

  updateWorkspace: async (id, data) => {
    const res = await api.put(`/workspaces/${id}`, data);
    const updated = res.data.workspace;
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? updated : w)),
      activeWorkspace: s.activeWorkspace?.id === id ? updated : s.activeWorkspace,
    }));
    localStorage.setItem('sp_workspace', JSON.stringify(updated));
    return updated;
  },

  deleteWorkspace: async (id) => {
    await api.delete(`/workspaces/${id}`);
    set((s) => {
      const workspaces = s.workspaces.filter((w) => w.id !== id);
      const activeWorkspace = s.activeWorkspace?.id === id
        ? (workspaces[0] || null)
        : s.activeWorkspace;
      if (activeWorkspace) localStorage.setItem('sp_workspace', JSON.stringify(activeWorkspace));
      else localStorage.removeItem('sp_workspace');
      return { workspaces, activeWorkspace };
    });
  },
}));
