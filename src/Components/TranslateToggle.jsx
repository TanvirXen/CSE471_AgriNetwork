import { usePageTranslator } from '../hooks/usePageTranslator';
import './TranslateToggle.css';

export default function TranslateToggle() {
  const { isEnglish, status, activate, restore } = usePageTranslator();

  const loading = status === 'loading';
  const error = status === 'error';

  const handleClick = () => {
    if (loading) return;
    if (isEnglish) restore();
    else activate();
  };

  return (
    <button
      className={[
        'translate-toggle',
        isEnglish ? 'translate-toggle--en' : '',
        loading ? 'translate-toggle--loading' : '',
        error ? 'translate-toggle--error' : '',
      ].filter(Boolean).join(' ')}
      onClick={handleClick}
      disabled={loading}
      title={
        loading ? 'Translating...'
        : error   ? 'Translation failed — click to retry'
        : isEnglish ? 'Switch back to Bengali'
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
          <span className={`tt-option${!isEnglish ? ' tt-option--active' : ''}`}>বাং</span>
          <span className="tt-sep" aria-hidden="true">|</span>
          <span className={`tt-option${isEnglish ? ' tt-option--active' : ''}`}>EN</span>
        </span>
      )}
    </button>
  );
}
