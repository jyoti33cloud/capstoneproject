import { useEffect, useState } from 'react';
import { Brush, UtensilsCrossed, GraduationCap, Car, Moon, CheckCircle2, Circle } from 'lucide-react';
import Layout from '../components/Layout';
import { useLang } from '../context/LangContext';
import api from '../api';

const TASKS = [
  { key: 'brushing',  icon: Brush,           iconColor: 'text-brand-600',  iconBg: 'bg-blue-100',     titleKey: 'task_brushing'  },
  { key: 'breakfast', icon: UtensilsCrossed, iconColor: 'text-orange-500', iconBg: 'bg-orange-100',   titleKey: 'task_breakfast' },
  { key: 'school',    icon: GraduationCap,   iconColor: 'text-purple-600', iconBg: 'bg-purple-100',   titleKey: 'task_school'    },
  { key: 'play',      icon: Car,             iconColor: 'text-green-600',  iconBg: 'bg-green-100',    titleKey: 'task_play'      },
  { key: 'sleep',     icon: Moon,            iconColor: 'text-indigo-600', iconBg: 'bg-indigo-100',   titleKey: 'task_sleep'     },
];

export default function DailyRoutine() {
  const { t, tBoth } = useLang();
  const [state, setState] = useState({ tasks: {}, completed: 0, total: TASKS.length });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/routine/today');
      setState(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggle(key) {
    // Optimistic update
    setState((prev) => {
      const next = { ...prev.tasks, [key]: !prev.tasks[key] };
      const completed = Object.values(next).filter(Boolean).length;
      return { ...prev, tasks: next, completed };
    });
    try {
      await api.post('/routine/toggle', { task_key: key });
    } catch {
      load();
    }
  }

  const progressPct = state.total ? (state.completed / state.total) * 100 : 0;

  return (
    <Layout>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{t('routine_title')}</h1>
        <p className="np text-slate-600 mt-1">{t('routine_subtitle')}</p>
      </div>

      <div className="bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-3xl p-6 mb-6 shadow-lg">
        <p className="text-sm font-semibold opacity-90">{t('progress_today')}</p>
        <p className="text-4xl font-extrabold mt-1">
          {state.completed} / {state.total} {t('tasks')}
        </p>
        <div className="mt-4 h-2 bg-white/25 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-8">{t('loading')}</p>
      ) : (
        <div className="space-y-3">
          {TASKS.map((task) => {
            const both = tBoth(task.titleKey);
            const done = !!state.tasks[task.key];
            const Icon = task.icon;
            return (
              <button
                key={task.key}
                onClick={() => toggle(task.key)}
                className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-card hover:shadow-md transition text-left"
              >
                <div className={`w-12 h-12 rounded-xl ${task.iconBg} flex items-center justify-center flex-none`}>
                  <Icon size={22} className={task.iconColor} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {both.en}
                  </p>
                  <p className={`np text-sm ${done ? 'text-slate-400' : 'text-slate-500'}`}>
                    {both.ne}
                  </p>
                </div>
                {done ? (
                  <CheckCircle2 size={28} className="text-brand-600 fill-brand-600 flex-none" strokeWidth={1.5} stroke="white" />
                ) : (
                  <Circle size={28} className="text-slate-300 flex-none" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
