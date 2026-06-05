import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function Register() {
  const { register, loading } = useAuth();
  const { t, lang, toggle } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '' });
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    const r = await register(form);
    if (r.ok) navigate('/home');
    else setErr(r.error);
  }

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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

        <p className="text-slate-600 mb-6">{t('home_subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder={t('name')} value={form.name} onChange={upd('name')}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
          <input required type="email" placeholder={t('email')} value={form.email} onChange={upd('email')}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
          <input required type="password" placeholder={`${t('password')} (min 6)`} value={form.password} onChange={upd('password')}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
          <input placeholder={t('city')} value={form.city} onChange={upd('city')}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />

          {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

          <button disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
            {loading ? t('loading') : t('register')}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          {t('has_account')}{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">{t('login')}</Link>
        </p>
      </div>
    </div>
  );
}
