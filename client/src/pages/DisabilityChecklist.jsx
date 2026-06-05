import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../api';

export default function DisabilityChecklist() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.get('/disability-checklist')
        .then(({ data }) => {
          setChecklist(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load checklist:', err);
          setLoading(false);
        });
    }
  }, [user]);

  async function toggleItem(key) {
    const item = checklist.find(i => i.key === key);
    const newStatus = !item.completed;

    try {
      await api.post(`/disability-checklist/${key}`, { completed: newStatus });
      setChecklist(checklist.map(i =>
        i.key === key ? { ...i, completed: newStatus } : i
      ));
    } catch (err) {
      console.error('Failed to update checklist:', err);
    }
  }

  const completed = checklist.filter(i => i.completed).length;
  const total = checklist.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (loading) {
    return <div className="p-4 text-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white p-6 rounded-b-3xl shadow-lg">
          <h1 className="text-3xl font-bold mb-2">
            {lang === 'ne' ? 'अक्षमता परिचयपत्र' : 'Disability ID Guide'}
          </h1>
          <p className="text-white/90">
            {lang === 'ne'
              ? 'सरकारी सहायताको लागि आवश्यक कागजात र प्रक्रिया'
              : 'Essential steps and documents for government support services'
            }
          </p>
        </div>

        {/* Progress */}
        <div className="p-6 bg-white border-b">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">
              {lang === 'ne' ? 'प्रगति' : 'Progress'}
            </span>
            <span className="text-sm font-semibold text-brand-600">
              {completed}/{total}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-brand-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {percentage}% {lang === 'ne' ? 'पूर्ण' : 'complete'}
          </p>
        </div>

        {/* Checklist Items */}
        <div className="p-4 space-y-3">
          {checklist.map((item, idx) => (
            <div
              key={item.key}
              className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 transition cursor-pointer"
              onClick={() => toggleItem(item.key)}
            >
              <div className="flex-shrink-0 pt-1">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => {}}
                  className="w-5 h-5 text-brand-600 rounded cursor-pointer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {idx + 1}. {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="p-6 mx-4 mt-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-2">
            {lang === 'ne' ? 'महत्वपूर्ण जानकारी' : 'Important Information'}
          </h3>
          <p className="text-sm text-blue-800">
            {lang === 'ne'
              ? 'यो सूची सरकारी अक्षमता परिचयपत्र र सहायताको लागि आवश्यक कदमहरूको एक मार्गदर्शक हो। प्रत्येक जिल्लामा प्रक्रिया अलग हुन सक्छ। स्थानीय सामाजिक विकास कार्यालयसँग संपर्क गरी बिस्तारित जानकारी प्राप्त गर्नुस्।'
              : 'This guide outlines essential steps for obtaining a government disability ID card and accessing support services. Processes may vary by district. Contact your local Social Development Office for detailed information.'
            }
          </p>
        </div>

        {/* Resources */}
        <div className="p-6 mx-4 mt-4 bg-green-50 border border-green-200 rounded-xl">
          <h3 className="font-semibold text-green-900 mb-3">
            {lang === 'ne' ? 'सहायक संसाधनहरू' : 'Helpful Resources'}
          </h3>
          <ul className="text-sm text-green-800 space-y-2">
            <li>• {lang === 'ne' ? 'स्थानीय अक्षमता केन्द्र' : 'Local disability centers'}</li>
            <li>• {lang === 'ne' ? 'सामाजिक विकास कार्यालय' : 'Social Development Office'}</li>
            <li>• {lang === 'ne' ? 'अक्षमता अधिकार संस्था' : 'Disability rights organizations'}</li>
            <li>• {lang === 'ne' ? 'अभिभावक सहयोग समूह' : 'Parent support groups'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
