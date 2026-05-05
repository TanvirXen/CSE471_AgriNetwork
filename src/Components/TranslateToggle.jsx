import { usePageTranslator } from '../hooks/usePageTranslator';
import { useLocation } from 'react-router-dom';
import './TranslateToggle.css';

export default function TranslateToggle() {
  const location = useLocation();
  const { language, status, toggleLanguage } = usePageTranslator();

  if (location.pathname === '/payments/sslcommerz/result') {
    return null;
  }

  const loading = status === 'loading';
  const error = status === 'error';
  const isEnglish = language === 'en';

  return (
    <button
      className={[
        'translate-toggle',
        isEnglish ? 'translate-toggle--en' : '',
        loading ? 'translate-toggle--loading' : '',
        error ? 'translate-toggle--error' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => {
        if (!loading) toggleLanguage();
      }}
      disabled={loading}
      title={
        loading
          ? 'Translating...'
          : error
            ? 'Translation failed - click to retry'
            : isEnglish
              ? 'Translate page to Bengali'
              : 'Translate page to English'
      }
      aria-label="Toggle page language"
      translate="no"
    >
      <span className="tt-globe" aria-hidden="true">🌐</span>

      {loading ? (
        <>
          <span className="tt-label">Translating</span>
          <span className="tt-spinner" aria-hidden="true" />
        </>
      ) : error ? (
        <span className="tt-label tt-label--error">Failed ↺</span>
      ) : (
        <span className="tt-track">
          <span className={`tt-option${language === 'bn' ? ' tt-option--active' : ''}`}>বাংলা</span>
          <span className="tt-sep" aria-hidden="true">|</span>
          <span className={`tt-option${language === 'en' ? ' tt-option--active' : ''}`}>EN</span>
        </span>
      )}
    </button>
  );
}
