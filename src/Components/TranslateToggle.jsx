import { useState, useEffect, useCallback } from 'react';
import './TranslateToggle.css';

const COOKIE_KEYS = ['googtrans'];

function readLangFromCookie() {
  const match = document.cookie.match(/googtrans=([^;]+)/);
  if (match) {
    const val = decodeURIComponent(match[1]);
    // format: /bn/en  or  /en/en
    return val.split('/').pop();
  }
  return null;
}

function clearGTCookies() {
  const paths = ['/', window.location.pathname];
  const domains = ['', '.' + window.location.hostname];
  const past = 'Thu, 01 Jan 1970 00:00:01 GMT';
  COOKIE_KEYS.forEach((key) => {
    paths.forEach((path) => {
      domains.forEach((domain) => {
        document.cookie = `${key}=; path=${path}; domain=${domain}; expires=${past}`;
      });
    });
  });
}

export default function TranslateToggle() {
  const [isEnglish, setIsEnglish] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const lang = readLangFromCookie();
    setIsEnglish(lang === 'en');
  }, []);

  const switchToEnglish = useCallback(() => {
    setLoading(true);
    const attempt = (retries) => {
      const select = document.querySelector('select.goog-te-combo');
      if (select) {
        select.value = 'en';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        setIsEnglish(true);
        setLoading(false);
      } else if (retries > 0) {
        setTimeout(() => attempt(retries - 1), 300);
      } else {
        setLoading(false);
      }
    };
    attempt(8);
  }, []);

  const restoreBengali = useCallback(() => {
    // Try clicking "Show original" inside the GT banner iframe first
    let restored = false;
    try {
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!doc) continue;
          const candidates = Array.from(doc.querySelectorAll('a, button, span'));
          const btn = candidates.find(
            (el) =>
              el.textContent?.toLowerCase().includes('original') ||
              el.className?.includes('close') ||
              el.className?.includes('restore')
          );
          if (btn) {
            btn.click();
            setIsEnglish(false);
            restored = true;
            break;
          }
        } catch (_) { /* cross-origin */ }
      }
    } catch (_) { /* ignore */ }

    if (!restored) {
      clearGTCookies();
      window.location.reload();
    }
  }, []);

  const toggle = () => {
    if (loading) return;
    if (isEnglish) restoreBengali();
    else switchToEnglish();
  };

  return (
    <button
      className={`translate-toggle${isEnglish ? ' translate-toggle--en' : ''}`}
      onClick={toggle}
      disabled={loading}
      title={isEnglish ? 'বাংলায় পড়ুন' : 'Read in English'}
      aria-label="Toggle language between Bengali and English"
    >
      <span className="translate-toggle__globe">🌐</span>
      <span className={`translate-toggle__pill-label${!isEnglish ? ' active' : ''}`}>বাং</span>
      <span className="translate-toggle__divider">|</span>
      <span className={`translate-toggle__pill-label${isEnglish ? ' active' : ''}`}>EN</span>
      {loading && <span className="translate-toggle__spinner" />}
    </button>
  );
}
