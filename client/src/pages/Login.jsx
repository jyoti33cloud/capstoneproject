import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function Login() {
  const { login, loginWithGoogle, loading, needsRoleSelection } = useAuth();
  const { t, lang, toggle } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    const r = await login(email, password);
    if (r.ok) navigate('/home');
    else setErr(r.error);
  }

  async function handleGoogleSuccess(credentialResponse) {
    setErr('');
    const r = await loginWithGoogle(credentialResponse);
    if (r.ok) {
      if (r.needsRoleSelection) {
        navigate('/select-role');
      } else {
        navigate('/home');
      }
    } else {
      setErr(r.error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-brand-600">
            Asha <span className="np text-2xl">(आशा)</span>
          </h1>
          <button
            type="button"
            onClick={toggle}
            className="px-3 py-1 rounded-full border border-slate-200 text-xs font-medium hover:bg-slate-50"
          >
            <span className={lang === 'en' ? 'text-brand-600 font-semibold' : 'text-slate-500'}>EN</span>
            <span className="mx-1.5 text-slate-300">|</span>
            <span className={`np ${lang === 'ne' ? 'text-brand-600 font-semibold' : 'text-slate-500'}`}>नेपाली</span>
          </button>
        </div>

        <p className="text-slate-600 mb-8">{t('home_subtitle')}</p>

        <div className="flex justify-center mb-8">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setErr('Google login failed')}
          />
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              placeholder="example@email.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('password')}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

          <button
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
          >
            {loading ? t('loading') : t('login')}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          {t('no_account')}{' '}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
