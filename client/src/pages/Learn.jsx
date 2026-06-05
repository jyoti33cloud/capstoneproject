import { useState } from 'react';
import { Brain, MessageSquare, SmilePlus, UtensilsCrossed, MessageSquareText } from 'lucide-react';
import Layout from '../components/Layout';
import LearningModal from '../components/LearningModal';
import { useLang } from '../context/LangContext';

const categories = [
  { id: 'understanding', iconBg: 'bg-blue-100',   icon: Brain,            iconColor: 'text-brand-600',  titleKey: 'learn_understanding' },
  { id: 'communication', iconBg: 'bg-green-100',  icon: MessageSquare,    iconColor: 'text-green-600',  titleKey: 'learn_communication', highlighted: true },
  { id: 'behavior', iconBg: 'bg-slate-100',  icon: SmilePlus,        iconColor: 'text-slate-700',  titleKey: 'learn_behavior' },
  { id: 'nutrition', iconBg: 'bg-rose-100',   icon: UtensilsCrossed,  iconColor: 'text-rose-600',   titleKey: 'learn_nutrition' },
];

const tipKeys = ['tip1', 'tip2', 'tip3'];

export default function Learn() {
  const { t, tBoth } = useLang();
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-slate-900">{t('learn_title')}</h1>
      <p className="text-slate-600 mt-1 mb-6">
        <span className="np">सिकाई केन्द्र</span> — Simple guides for every day.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {categories.map(({ id, iconBg, icon: Icon, iconColor, titleKey, highlighted }) => {
          const both = tBoth(titleKey);
          return (
            <button
              key={id}
              onClick={() => setSelectedCategory(id)}
              className={`bg-white rounded-2xl p-6 border-2 transition text-center hover:shadow-card active:scale-95 ${
                highlighted ? 'border-brand-600' : 'border-slate-200'
              }`}
            >
              <div className={`w-16 h-16 mx-auto rounded-full ${iconBg} flex items-center justify-center mb-3`}>
                <Icon size={26} className={iconColor} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-brand-600 text-lg leading-tight">{both.en}</h3>
              <p className="np text-sm text-slate-500 mt-1">{both.ne}</p>
            </button>
          );
        })}
      </div>

      <LearningModal category={selectedCategory} onClose={() => setSelectedCategory(null)} />

      {/* Effective Communication card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
        <div className="flex items-center gap-3 mb-5">
          <MessageSquareText className="text-green-600" size={26} />
          <h2 className="text-xl font-bold text-slate-900">{t('effective_comm')}</h2>
        </div>

        <ol className="space-y-4">
          {tipKeys.map((key, idx) => {
            const both = tBoth(key);
            return (
              <li key={key} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex-none flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{both.en}</p>
                  <p className="np text-sm text-slate-500">{both.ne}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Layout>
  );
}
