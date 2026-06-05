import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserSearch, CalendarDays, Clock, CheckCircle2, Check } from 'lucide-react';
import Layout from '../components/Layout';
import { useLang } from '../context/LangContext';
import api from '../api';

const TIME_SLOTS = ['09:00 AM', '10:30 AM', '01:00 PM', '03:30 PM'];

function nextDays(n) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function BookAppointment() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { specialistId } = useParams();

  const [specialists, setSpecialists] = useState([]);
  const [selectedId, setSelectedId] = useState(specialistId ? Number(specialistId) : null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const days = useMemo(() => nextDays(4), []);

  useEffect(() => {
    api.get('/specialists', { params: { type: 'specialist' } })
      .then((r) => {
        setSpecialists(r.data);
        if (!selectedId && r.data.length) setSelectedId(r.data[0].id);
      });
    setSelectedDate(days[1] || days[0]);
    setSelectedTime(TIME_SLOTS[1]);
  }, []); // eslint-disable-line

  async function confirm() {
    if (!selectedId || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      const isoDate = selectedDate.toISOString().slice(0, 10);
      await api.post('/appointments', {
        specialist_id: selectedId,
        appointment_date: isoDate,
        appointment_time: selectedTime,
      });
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 1500);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold text-slate-900">{t('book_session')}</h1>
        <p className="text-slate-600 text-sm mt-1">{t('book_session_sub')}</p>
      </div>

      <section className="mb-6">
        <h2 className="flex items-center gap-2 text-green-700 font-semibold mb-3">
          <UserSearch size={20} />
          {t('select_specialist')}
        </h2>
        <div className="space-y-3">
          {specialists.slice(0, 4).map((s) => {
            const active = selectedId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`w-full flex items-center gap-4 bg-white rounded-2xl p-4 border-2 transition text-left ${
                  active ? 'border-green-500 shadow-card' : 'border-slate-200'
                }`}
              >
                <img
                  src={s.image_url}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => { e.target.src = 'https://placehold.co/100?text=Dr'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{s.name}</p>
                  <p className="text-sm text-slate-500 truncate">{s.specialty}</p>
                </div>
                {active && (
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center flex-none">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="flex items-center gap-2 text-green-700 font-semibold mb-3">
          <CalendarDays size={20} />
          {t('pick_date')}
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {days.map((d) => {
            const active = selectedDate?.toDateString() === d.toDateString();
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDate(d)}
                className={`bg-white rounded-2xl py-3 text-center border-2 transition ${
                  active ? 'border-green-500 bg-green-50' : 'border-slate-200'
                }`}
              >
                <p className="text-[11px] tracking-wider font-semibold text-slate-500">
                  {DAY_LABELS[d.getDay()]}
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{d.getDate()}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="flex items-center gap-2 text-green-700 font-semibold mb-3">
          <span className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
            <Clock size={13} className="text-white" />
          </span>
          {t('select_time')}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {TIME_SLOTS.map((slot) => {
            const active = selectedTime === slot;
            return (
              <button
                key={slot}
                onClick={() => setSelectedTime(slot)}
                className={`bg-white rounded-2xl py-4 font-semibold border-2 transition ${
                  active ? 'border-green-500 bg-green-50 text-slate-900' : 'border-slate-200 text-slate-700'
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </section>

      <button
        onClick={confirm}
        disabled={submitting || !selectedId || !selectedDate || !selectedTime}
        className="w-full bg-brand-700 hover:bg-brand-800 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-3 disabled:opacity-60 transition"
      >
        <CheckCircle2 size={20} />
        <span>{t('confirm')} / <span className="np">पक्का गर्नुहोस्</span></span>
      </button>
      <p className="text-center text-xs text-slate-500 mt-3 italic">{t('reminder_note')}</p>

      {success && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 size={36} className="text-green-600" />
            </div>
            <p className="text-lg font-bold text-slate-900">{t('booked')}</p>
          </div>
        </div>
      )}
    </Layout>
  );
}
