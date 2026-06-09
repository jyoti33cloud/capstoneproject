import { Home, BookOpen, Users, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useLang } from '../context/LangContext';

export default function BottomNav() {
  const { t } = useLang();

  const items = [
    { to: '/home', icon: Home, label: t('nav_home') },
    { to: '/learn', icon: BookOpen, label: t('nav_learn') },
    { to: '/community', icon: Users, label: t('nav_community') },
    { to: '/profile', icon: User, label: t('nav_profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 max-w-2xl mx-auto">
      <div className="flex items-center justify-around px-4 py-2">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition min-w-[64px] ${
                isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
