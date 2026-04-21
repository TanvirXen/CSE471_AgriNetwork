import { usePageTranslator } from '../hooks/usePageTranslator';
import './TranslateToggle.css';

export default function TranslateToggle() {
  const { isEnglish, status, activate, restore } = usePageTranslator();

  const loading = status === 'loading';

  const handleClick = () => {
    if (loading) return;
    if (isEnglish) restore();
    else activate();
  };

  return (
    <button
      className={`translate-toggle${isEnglish ? ' translate-toggle--en' : ''}${loading ? ' translate-toggle--loading' : ''}`}
      onClick={handleClick}
      disabled={loading}
      title={isEnglish ? 'বাংলায় ফিরুন (Restore Bengali)' : 'Translate page to English'}
      aria-label="Toggle page language"
      translate="no"
    >
      <span className="tt-globe" aria-hidden="true">🌐</span>

      <span className="tt-track">
        <span className={`tt-option${!isEnglish ? ' tt-option--active' : ''}`}>বাং</span>
        <span className="tt-sep">|</span>
        <span className={`tt-option${isEnglish ? ' tt-option--active' : ''}`}>EN</span>
      </span>

      {loading && (
        <span className="tt-spinner" aria-hidden="true" />
      )}
    </button>
  );
}
