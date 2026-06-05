import { Link } from 'react-router-dom';
import { BookOpen, Users, HeartHandshake, CalendarDays, Clock, LayoutGrid, CheckCircle2 } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

const tiles = [
  { to: '/learn',     iconBg: 'bg-blue-100',   icon: BookOpen,       iconColor: 'text-brand-600',  titleKey: 'tile_learn',     accent: 'text-brand-600' },
  { to: '/community', iconBg: 'bg-green-100',  icon: Users,          iconColor: 'text-green-600',  titleKey: 'tile_community', accent: 'text-green-600' },
  { to: '/find-help', iconBg: 'bg-slate-100',  icon: HeartHandshake, iconColor: 'text-slate-700',  titleKey: 'tile_findhelp',  accent: 'text-slate-800' },
  { to: '/book',      iconBg: 'bg-rose-100',   icon: CalendarDays,   iconColor: 'text-rose-600',   titleKey: 'tile_book',      accent: 'text-rose-700' },
  { to: '/routine',   iconBg: 'bg-blue-100',   icon: Clock,          iconColor: 'text-brand-600',  titleKey: 'tile_routine',   accent: 'text-brand-600' },
  { to: '/aac',       iconBg: 'bg-blue-100',   icon: LayoutGrid,     iconColor: 'text-brand-600',  titleKey: 'tile_aac',       accent: 'text-brand-600' },
  { to: '/disability-checklist', iconBg: 'bg-purple-100', icon: CheckCircle2, iconColor: 'text-purple-600', titleKey: 'tile_disability', accent: 'text-purple-700' },
];

export default function Home() {
  const { user } = useAuth();
  const { t, tBoth } = useLang();

  return (
    <Layout showBack={false}>
      {/* Greeting card */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-brand-600">
          {t('greeting', { name: user?.name || 'Parent' })}
        </h2>
        <p className="text-sm text-slate-500 np mt-1">नमस्ते, अभिभावक</p>
      </div>
      <p className="text-slate-700 mb-6">{t('home_subtitle')}</p>

      <div className="grid grid-cols-2 gap-4">
        {tiles.map(({ to, iconBg, icon: Icon, iconColor, titleKey, accent }) => {
          const both = tBoth(titleKey);
          return (
            <Link
              key={to}
              to={to}
              className="bg-white rounded-2xl p-5 border-2 border-dashed border-slate-200 hover:border-brand-300 hover:shadow-card transition group"
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-4 group-hover:scale-105 transition`}>
                <Icon size={22} className={iconColor} strokeWidth={2.2} />
              </div>
              <h3 className={`font-semibold ${accent} text-base leading-tight`}>{both.en}</h3>
              <p className="np text-sm text-slate-500 mt-0.5">{both.ne}</p>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
}
