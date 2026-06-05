import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkAdminStatus = useCallback(async (token) => {
    try {
      const { data } = await api.get('/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAdmin(true);
      setAdminRole(data.role || 'moderator');
      return true;
    } catch (e) {
      setIsAdmin(false);
      setAdminRole(null);
      return false;
    }
  }, []);

  const getDashboardStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/dashboard');
      return data.stats;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to fetch dashboard stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Therapist Management
  const getPendingTherapists = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/therapists/pending');
      return data.therapists;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to fetch pending therapists');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllTherapists = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/therapists');
      return data.therapists;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to fetch therapists');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyTherapist = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/admin/therapists/${id}/verify`);
      return data;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to verify therapist');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectTherapist = useCallback(async (id, reason) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/admin/therapists/${id}/reject`, { reason });
      return data;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to reject therapist');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTherapist = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await api.delete(`/admin/therapists/${id}`);
      return data;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to delete therapist');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Content Moderation
  const getFlaggedPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/posts/flagged');
      return data.posts;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to fetch flagged posts');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const approvePost = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/admin/posts/${id}/approve`);
      return data;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to approve post');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePost = useCallback(async (id, reason) => {
    setLoading(true);
    try {
      const { data } = await api.delete(`/admin/posts/${id}`, { data: { reason } });
      return data;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to delete post');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Forum Moderation
  const getFlaggedComments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/comments/flagged');
      return data.comments;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to fetch flagged comments');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const approveComment = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/admin/comments/${id}/approve`);
      return data;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to approve comment');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteComment = useCallback(async (id, reason) => {
    setLoading(true);
    try {
      const { data } = await api.delete(`/admin/comments/${id}`, { data: { reason } });
      return data;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to delete comment');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // User Management
  const getUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      return data.users;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to fetch users');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const banUser = useCallback(async (id, reason) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/admin/users/${id}/ban`, { reason });
      return data;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to ban user');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const unbanUser = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/admin/users/${id}/unban`);
      return data;
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to unban user');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        adminRole,
        loading,
        error,
        checkAdminStatus,
        getDashboardStats,
        getPendingTherapists,
        getAllTherapists,
        verifyTherapist,
        rejectTherapist,
        deleteTherapist,
        getFlaggedPosts,
        approvePost,
        deletePost,
        getFlaggedComments,
        approveComment,
        deleteComment,
        getUsers,
        banUser,
        unbanUser
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};
