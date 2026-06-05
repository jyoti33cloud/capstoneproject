import { useEffect, useState } from 'react';
import { Heart, MessageCircle, CornerUpLeft, PlusCircle, X } from 'lucide-react';
import Layout from '../components/Layout';
import { useLang } from '../context/LangContext';
import api from '../api';

export default function Community() {
  const { t, lang } = useLang();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/community/posts', { params: { category: filter } });
      setPosts(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  async function toggleLike(postId) {
    try {
      await api.post(`/community/posts/${postId}/like`);
      load();
    } catch {}
  }

  const filters = [
    { key: 'all',       labelEn: t('all_posts') },
    { key: 'behavior',  labelEn: t('cat_behavior') },
    { key: 'schooling', labelEn: t('cat_schooling') },
    { key: 'therapy',   labelEn: t('cat_therapy') },
  ];

  return (
    <Layout>
      {/* Banner */}
      <div className="rounded-2xl overflow-hidden mb-5 bg-gradient-to-br from-rose-100 via-orange-100 to-amber-100 p-8 text-center relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529390079861-591de354faf5?w=900&q=70&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-multiply" />
        <div className="relative">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">{t('community_title')}</h2>
          <p className="text-slate-700 text-sm">{t('community_subtitle')}</p>
        </div>
      </div>

      {/* Ask Question button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-brand-700 hover:bg-brand-800 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-3 mb-5 shadow-card transition"
      >
        <PlusCircle size={22} />
        <span>{t('ask_question')} / <span className="np">प्रश्न सोध्नुहोस्</span></span>
      </button>

      {/* Filter pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-none px-5 py-2 rounded-full text-sm font-semibold border transition ${
              filter === f.key
                ? 'bg-brand-700 text-white border-brand-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.labelEn}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading && <p className="text-center text-slate-400 py-8">{t('loading')}</p>}

      <div className="space-y-4">
        {posts.map((p) => (
          <article key={p.id} className="bg-white rounded-2xl p-5 shadow-card">
            <header className="flex items-center gap-3 mb-3">
              <img
                src={p.author_avatar || `https://i.pravatar.cc/150?u=${p.user_id}`}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-slate-900">{p.author_name}</p>
                <p className="text-xs text-slate-500">
                  {timeAgo(p.created_at, lang)} • {p.author_city || '—'}
                </p>
              </div>
            </header>

            <h3 className="text-lg font-bold text-brand-600 leading-snug mb-2">{p.title}</h3>
            <p className="text-slate-700 text-sm leading-relaxed">{p.body}</p>

            <hr className="my-4 border-slate-100" />

            <footer className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <button
                  onClick={() => toggleLike(p.id)}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-rose-500 transition"
                >
                  <Heart size={18} />
                  <span className="text-sm">{p.likes}</span>
                </button>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <MessageCircle size={18} />
                  <span className="text-sm">{p.replies}</span>
                </span>
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition">
                <CornerUpLeft size={16} />
                <span>{t('reply')}</span>
              </button>
            </footer>
          </article>
        ))}

        {!loading && posts.length === 0 && (
          <p className="text-center text-slate-400 py-8">No posts yet.</p>
        )}
      </div>

      {showModal && <NewPostModal onClose={() => setShowModal(false)} onCreated={load} />}
    </Layout>
  );
}

function NewPostModal({ onClose, onCreated }) {
  const { t } = useLang();
  const [form, setForm] = useState({ title: '', body: '', category: 'general' });
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/community/posts', form);
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t('ask_question')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={22} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            required
            placeholder={t('new_post_title')}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
          />
          <textarea
            required
            rows={4}
            placeholder={t('new_post_body')}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="general">General</option>
            <option value="behavior">Behavior</option>
            <option value="schooling">Schooling</option>
            <option value="therapy">Therapy</option>
          </select>
          <button
            disabled={saving}
            className="w-full bg-brand-700 hover:bg-brand-800 text-white rounded-xl py-3 font-semibold disabled:opacity-60"
          >
            {saving ? t('loading') : t('post_submit')}
          </button>
        </form>
      </div>
    </div>
  );
}

function timeAgo(iso, lang) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return lang === 'ne' ? 'अहिले' : 'just now';
  if (diff < 3600) return lang === 'ne' ? `${Math.floor(diff / 60)} मिनेट अघि` : `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return lang === 'ne' ? `${Math.floor(diff / 3600)} घण्टा अघि` : `${Math.floor(diff / 3600)} hours ago`;
  return lang === 'ne' ? `${Math.floor(diff / 86400)} दिन अघि` : `${Math.floor(diff / 86400)} days ago`;
}
