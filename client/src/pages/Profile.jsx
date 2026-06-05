import { useEffect, useState } from 'react';
import { LogOut, MapPin, CalendarDays, Trash2, Upload, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../api';

export default function Profile() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/appointments');
      setAppointments(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function cancelAppt(id) {
    if (!confirm('Cancel this appointment?')) return;
    await api.delete(`/appointments/${id}`);
    load();
  }

  async function handlePictureUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('picture', file);
      const { data } = await api.post('/profile/upload-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarUrl(data.avatar_url);
    } catch (err) {
      alert('Failed to upload picture: ' + (err.response?.data?.error || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <Layout showBack={false}>
      <div className="bg-white rounded-3xl p-6 shadow-card flex items-center gap-4 mb-6 relative">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-brand-50"
              alt="Profile"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center ring-4 ring-brand-50">
              <User size={32} className="text-slate-400" />
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-full cursor-pointer transition shadow-md">
            <Upload size={14} />
            <input
              type="file"
              accept="image/*"
              onChange={handlePictureUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{user?.name}</h1>
          <p className="text-sm text-slate-600 truncate">{user?.email}</p>
          {user?.city && (
            <p className="flex items-center gap-1 text-sm text-slate-500 mt-1">
              <MapPin size={14} /> {user.city}
            </p>
          )}
        </div>
      </div>

      <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
        <CalendarDays size={20} className="text-brand-600" />
        {t('my_appointments')}
      </h2>

      {loading && <p className="text-center text-slate-400 py-6">{t('loading')}</p>}

      {!loading && appointments.length === 0 && (
        <p className="text-center text-slate-500 bg-white rounded-2xl py-8 shadow-card">
          {t('no_appointments')}
        </p>
      )}

      <div className="space-y-3 mb-8">
        {appointments.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-4">
            <img
              src={a.image_url}
              className="w-12 h-12 rounded-xl object-cover flex-none"
              alt=""
              onError={(e) => { e.target.src = 'https://placehold.co/100?text=Dr'; }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{a.specialist_name}</p>
              <p className="text-xs text-slate-500 truncate">{a.specialty}</p>
              <p className="text-sm text-brand-600 font-medium mt-1">
                {new Date(a.appointment_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                {' · '}
                {a.appointment_time}
              </p>
            </div>
            <button
              onClick={() => cancelAppt(a.id)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition flex-none"
              aria-label="Cancel"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-2xl py-3 font-semibold flex items-center justify-center gap-2 transition"
      >
        <LogOut size={18} />
        {t('logout')}
      </button>
    </Layout>
  );
}
