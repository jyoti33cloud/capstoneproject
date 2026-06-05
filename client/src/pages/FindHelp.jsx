import { useEffect, useState } from 'react';
import { Search, MapPin, CalendarDays, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useLang } from '../context/LangContext';
import api from '../api';

export default function FindHelp() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/specialists', { params: { type, q } });
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [type, q]);

  const filters = [
    { key: 'all',        label: t('all_resources') },
    { key: 'center',     label: t('therapy_centers') },
    { key: 'specialist', label: t('specialists') },
  ];

  return (
    <Layout>
      <div className="relative mb-5">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full bg-white rounded-2xl pl-12 pr-4 py-3.5 border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm"
        />
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setType(f.key)}
            className={`flex-none px-5 py-2 rounded-full text-sm font-semibold border transition ${
              type === f.key
                ? 'bg-brand-700 text-white border-brand-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-slate-400 py-8">{t('loading')}</p>}

      <div className="space-y-4">
        {items.map((s) => (
          <article key={s.id} className="bg-white rounded-2xl p-4 shadow-card">
            <div className="flex gap-4">
              <img
                src={s.image_url}
                alt=""
                className="w-20 h-20 rounded-xl object-cover flex-none"
                onError={(e) => { e.target.src = 'https://placehold.co/200x200?text=Asha'; }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 truncate">{s.name}</h3>
                  <span className="flex-none bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    {Number(s.rating).toFixed(1)}
                    <Star size={11} className="fill-current" />
                  </span>
                </div>
                <p className="flex items-center gap-1 text-sm text-slate-600 mt-0.5">
                  <MapPin size={14} className="text-slate-400" />
                  {s.location}
                </p>
                <p className="text-sm text-slate-700 mt-1.5 leading-snug">{s.specialty}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/book/${s.id}`)}
              className="w-full mt-4 bg-brand-700 hover:bg-brand-800 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition"
            >
              <CalendarDays size={18} />
              <span>{t('book')} / <span className="np">बुक गर्नुहोस्</span></span>
            </button>
          </article>
        ))}

        {!loading && items.length === 0 && (
          <p className="text-center text-slate-400 py-8">No results found.</p>
        )}
      </div>
    </Layout>
  );
}
