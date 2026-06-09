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
      // With HashRouter the active route lives in the hash (e.g. "#/login"),
      // while pathname is always "/". Detect auth pages from the hash so a
      // failed login 401 doesn't trigger a redirect loop.
      const hash = window.location.hash || '';
      const isAuthPage =
        hash.startsWith('#/login') ||
        hash.startsWith('#/register') ||
        hash.startsWith('#/select-role');
      if (!isAuthPage) {
        window.location.replace('/#/login');
      }
    }
    return Promise.reject(err);
  }
);

export default api;