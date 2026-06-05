import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('asha_user') || 'null'); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('asha_token');
    if (token && !user) {
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data.user);
          localStorage.setItem('asha_user', JSON.stringify(data.user));
        })
        .catch((err) => {
          console.error('Auth check failed:', err.message);
          localStorage.removeItem('asha_token');
          localStorage.removeItem('asha_user');
        });
    }
  }, [user]);

  async function login(email, password) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('asha_token', data.token);
      localStorage.setItem('asha_user', JSON.stringify(data.user));
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message || 'Login failed';
      console.error('Login error:', errorMsg);
      return { ok: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle(credentialResponse) {
    setLoading(true);
    try {
      if (!credentialResponse?.credential) {
        throw new Error('No Google credential received');
      }

      const profile = credentialResponse.credential;
      const decoded = JSON.parse(atob(profile.split('.')[1]));

      console.log('Google decode successful:', decoded.email);

      const { data } = await api.post('/auth/google', {
        googleToken: credentialResponse.credential,
        profile: {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture
        }
      });

      localStorage.setItem('asha_token', data.token);
      localStorage.setItem('asha_user', JSON.stringify(data.user));
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message || 'Google login failed';
      console.error('Google login error:', errorMsg, e);
      return { ok: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('asha_token', data.token);
      localStorage.setItem('asha_user', JSON.stringify(data.user));
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message || 'Registration failed';
      console.error('Registration error:', errorMsg);
      return { ok: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('asha_token');
    localStorage.removeItem('asha_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
