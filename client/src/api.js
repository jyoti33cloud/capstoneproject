import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('asha_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('asha_token');
      localStorage.removeItem('asha_user');

      // Force a clean re-login instead of leaving the user stranded on a
      // broken page with an invalid/expired token. Avoid redirect loops on
      // the auth pages themselves.
      const path = window.location.pathname;
      const isAuthPage = path === '/login' || path === '/register' || path === '/select-role';
      if (!isAuthPage) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(err);
  }
);

export default api;