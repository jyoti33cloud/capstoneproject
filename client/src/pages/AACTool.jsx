import { useState } from 'react';
import { UtensilsCrossed, GlassWater, Car, BedDouble, Lightbulb } from 'lucide-react';
import Layout from '../components/Layout';
import { useLang } from '../context/LangContext';

const CARDS = [
  { key: 'aac_eat',   icon: UtensilsCrossed, en: 'Eat',   ne: 'खानु',  speakEn: 'I want to eat',   speakNe: 'मलाई खानु छ' },
  { key: 'aac_drink', icon: GlassWater,      en: 'Drink', ne: 'पिउनु', speakEn: 'I want to drink', speakNe: 'मलाई पिउनु छ' },
  { key: 'aac_play',  icon: Car,             en: 'Play',  ne: 'खेल्नु', speakEn: 'I want to play',  speakNe: 'मलाई खेल्नु छ' },
  { key: 'aac_sleep', icon: BedDouble,       en: 'Sleep', ne: 'सुत्नु', speakEn: 'I want to sleep', speakNe: 'मलाई सुत्नु छ' },
];

export default function AACTool() {
  const { t, lang } = useLang();
  const [active, setActive] = useState(null);

  function speak(card) {
    setActive(card.key);
    setTimeout(() => setActive(null), 600);

    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      const text = lang === 'ne' ? card.speakNe : card.speakEn;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'ne' ? 'ne-NP' : 'en-US';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (_e) {
      // Speech synthesis not supported - fail silently
    }
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-slate-900">{t('aac_title')}</h1>
      <p className="text-slate-600 mt-1 mb-6">{t('aac_subtitle')}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {CARDS.map((c) => {
          const Icon = c.icon;
          const isActive = active === c.key;
          return (
            <button
              key={c.key}
              onClick={() => speak(c)}
              className={`bg-white rounded-2xl border-2 p-6 flex flex-col items-center justify-center aspect-square transition shadow-card ${
                isActive ? 'border-brand-600 bg-brand-50 scale-95' : 'border-slate-200 hover:border-brand-300'
              }`}
            >
              <Icon size={64} className="text-brand-600 mb-3" strokeWidth={2} />
              <p className="text-2xl font-bold text-slate-900">{c.en}</p>
              <p className="np text-base text-slate-500 mt-0.5">{c.ne}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50/60 rounded-2xl p-4 flex items-center gap-4 border border-blue-100">
        <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center flex-none">
          <Lightbulb size={26} className="text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-brand-700">{t('aac_help_title')}</p>
          <p className="text-sm text-slate-600 mt-0.5">{t('aac_help_body')}</p>
        </div>
      </div>
    </Layout>
  );
}
