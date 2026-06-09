// src/components/LanguageToggle.tsx
import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggle = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div className="flex gap-1 bg-green-700 p-1 rounded-full">
      <button
        onClick={() => toggle('en')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
          i18n.language === 'en'
            ? 'bg-white text-green-700'
            : 'text-white/70 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => toggle('ta')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
          i18n.language === 'ta'
            ? 'bg-white text-green-700'
            : 'text-white/70 hover:text-white'
        }`}
      >
        த
      </button>
    </div>
  );
}