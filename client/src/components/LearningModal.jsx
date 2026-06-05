import { X } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function LearningModal({ category, onClose }) {
  const { t, tBoth, lang } = useLang();

  if (!category) return null;

  const guidanceKey = `learn_${category}_guidance`;
  const pointsKey = `learn_${category}_points`;

  const guidance = t(guidanceKey);
  const pointsString = t(pointsKey);
  const points = pointsString.split('|').filter(p => p.trim());

  const categoryColors = {
    understanding: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
    communication: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },
    behavior: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700' },
    nutrition: { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700' },
  };

  const colors = categoryColors[category] || categoryColors.understanding;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto ${colors.bg} ${colors.border} border`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {tBoth(`learn_${category}`).primary}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Guidance */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wide text-slate-600">
              {lang === 'en' ? 'Guidance' : 'मार्गदर्शन'}
            </h3>
            <p className="text-slate-700 leading-relaxed">
              {guidance}
            </p>
          </div>

          {/* Key Points */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wide text-slate-600">
              {lang === 'en' ? 'Key Points' : 'मुख्य बिन्दुहरु'}
            </h3>
            <ul className="space-y-2">
              {points.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className={`flex-none w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5 ${colors.badge.split(' ')[0]}`}>
                    {idx + 1}
                  </div>
                  <p className="text-slate-700">
                    {point.trim()}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-white sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
