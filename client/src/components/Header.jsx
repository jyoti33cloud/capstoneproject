import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';

export default function Header({ showBack = true, onBack }) {
  const navigate = useNavigate();
  const { lang, toggle } = useLang();

  const handleBack = () => {
    if (onBack) return onBack();
    navigate(-1);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-100">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-1.5 -ml-1.5 text-brand-600 hover:bg-slate-100 rounded-lg transition"
              aria-label="Back"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
          )}
          <span className="text-xl font-bold text-brand-600">
            Asha <span className="np text-lg">(आशा)</span>
          </span>
        </div>

        <button
          onClick={toggle}
          className="px-4 py-1.5 rounded-full border border-slate-200 text-sm font-medium hover:bg-slate-50 transition"
          aria-label="Toggle language"
        >
          <span className={lang === 'en' ? 'text-brand-600 font-semibold' : 'text-slate-500'}>EN</span>
          <span className="mx-1.5 text-slate-300">|</span>
          <span className={`np ${lang === 'ne' ? 'text-brand-600 font-semibold' : 'text-slate-500'}`}>नेपाली</span>
        </button>
      </div>
    </header>
  );
}
