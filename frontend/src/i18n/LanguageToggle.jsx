import { useEffect, useState } from 'react';
import { DEFAULT_LANGUAGE, getStoredLanguage, setStoredLanguage } from './domTranslator';

export default function LanguageToggle() {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    setLanguage(getStoredLanguage());
    const sync = () => setLanguage(getStoredLanguage());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const selectLanguage = (nextLanguage) => {
    if (nextLanguage === language) return;
    setStoredLanguage(nextLanguage);
    window.dispatchEvent(new CustomEvent('language-change', { detail: nextLanguage }));
    window.location.reload();
  };

  return (
    <div className="inline-flex items-center border border-line rounded overflow-hidden text-[10px] font-mono" data-i18n-skip>
      <button
        type="button"
        onClick={() => selectLanguage('en')}
        className={`px-2 py-1 ${language === 'en' ? 'bg-signal text-void' : 'text-ink-muted hover:text-ink'}`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => selectLanguage('es')}
        className={`px-2 py-1 border-l border-line ${language === 'es' ? 'bg-signal text-void' : 'text-ink-muted hover:text-ink'}`}
        aria-label="Cambiar a espanol"
      >
        ES
      </button>
    </div>
  );
}

