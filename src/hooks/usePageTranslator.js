import { useState, useRef, useCallback, useEffect } from 'react';

// Bengali Unicode block — only translate text containing these chars
const BENGALI = /[\u0980-\u09FF]/;
const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'iframe', 'code', 'pre', 'textarea', 'input', 'select']);
const CACHE_KEY = 'agri_bn_en_v3';

// ── Persistent cache ─────────────────────────────────────────────────────────
function loadCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}'); }
  catch { return {}; }
}
function persistCache(c) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(c)); }
  catch {}
}

// ── MyMemory API (free, CORS-enabled, no key) ────────────────────────────────
async function fetchTranslation(text) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const url =
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=bn|en`;
    const res = await fetch(url, { signal: ctrl.signal });
    const json = await res.json();
    clearTimeout(tid);
    if (json.responseStatus === 200 && json.responseData?.translatedText) {
      const t = json.responseData.translatedText.trim();
      // Reject if API returned the same text or something that still has Bengali
      if (t && t !== text && !BENGALI.test(t)) return t;
    }
  } catch { clearTimeout(tid); }
  return null; // signal: no usable translation
}

async function translateBatch(texts, cache) {
  // Only process texts not already cached and containing Bengali
  const todo = [...new Set(texts)].filter(t => BENGALI.test(t) && t.length > 1 && !cache[t]);
  if (!todo.length) return;

  // 4 parallel requests
  const CONC = 4;
  for (let i = 0; i < todo.length; i += CONC) {
    const slice = todo.slice(i, i + CONC);
    const results = await Promise.all(slice.map(fetchTranslation));
    slice.forEach((orig, idx) => {
      if (results[idx]) cache[orig] = results[idx];
    });
    persistCache(cache);
  }
}

// ── DOM helpers ──────────────────────────────────────────────────────────────

// Collect text nodes that contain Bengali characters — used BEFORE translation
function getBengaliNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = (node.nodeValue || '').trim();
      if (!text || text.length < 2 || !BENGALI.test(text)) return NodeFilter.FILTER_REJECT;
      const el = node.parentElement;
      if (!el) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(el.tagName?.toLowerCase())) return NodeFilter.FILTER_REJECT;
      if (el.closest('[translate="no"], .translate-toggle, .translate-no'))
        return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  return nodes;
}

function setNodeTranslated(node, translated) {
  const raw = node.nodeValue || '';
  const lead = raw.match(/^\s*/)?.[0] ?? '';
  const trail = raw.match(/\s*$/)?.[0] ?? '';
  node.nodeValue = lead + translated + trail;
}

function applyFromCache(nodes, cache) {
  nodes.forEach(node => {
    const text = (node.nodeValue || '').trim();
    if (text && cache[text]) setNodeTranslated(node, cache[text]);
  });
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function usePageTranslator() {
  const [isEnglish, setIsEnglish] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const cache = useRef(loadCache());
  const applying = useRef(false);
  const obsRef = useRef(null);
  const newContentTimer = useRef(null);

  // MutationObserver: watches for React re-renders reverting translated text,
  // and for newly loaded Bengali content (e.g. chat messages from API).
  useEffect(() => {
    if (!isEnglish) return;

    const obs = new MutationObserver((mutations) => {
      if (applying.current) return;

      const newBengali = new Set(); // nodes with unseen Bengali text

      applying.current = true;
      mutations.forEach((m) => {
        if (m.type === 'characterData') {
          // React reverted one of our translated nodes back to Bengali
          const text = (m.target.nodeValue || '').trim();
          if (!text) return;
          const t = cache.current[text];
          if (t) {
            // Re-apply immediately (sync)
            setNodeTranslated(m.target, t);
          } else if (BENGALI.test(text)) {
            // New Bengali text we haven't seen — queue for translation
            newBengali.add(m.target);
          }
        } else if (m.type === 'childList') {
          m.addedNodes.forEach((added) => {
            if (added.nodeType === Node.TEXT_NODE) {
              const text = (added.nodeValue || '').trim();
              if (!text) return;
              const t = cache.current[text];
              if (t) setNodeTranslated(added, t);
              else if (BENGALI.test(text)) newBengali.add(added);
            } else if (added.nodeType === Node.ELEMENT_NODE) {
              // Newly inserted element — find its Bengali text nodes
              const nodes = getBengaliNodes(added);
              nodes.forEach((node) => {
                const text = (node.nodeValue || '').trim();
                const t = cache.current[text];
                if (t) setNodeTranslated(node, t);
                else newBengali.add(node);
              });
            }
          });
        }
      });
      // Reset flag after microtasks generated by our DOM writes have fired
      setTimeout(() => { applying.current = false; }, 0);

      // Async: translate new Bengali content (e.g. incoming chat messages)
      if (newBengali.size > 0) {
        clearTimeout(newContentTimer.current);
        newContentTimer.current = setTimeout(async () => {
          const texts = [...newBengali]
            .map((n) => (n.nodeValue || '').trim())
            .filter((t) => BENGALI.test(t));

          await translateBatch(texts, cache.current);

          applying.current = true;
          newBengali.forEach((node) => {
            const text = (node.nodeValue || '').trim();
            const t = cache.current[text];
            if (t) setNodeTranslated(node, t);
          });
          setTimeout(() => { applying.current = false; }, 0);
        }, 400);
      }
    });

    obs.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    obsRef.current = obs;

    return () => {
      obs.disconnect();
      clearTimeout(newContentTimer.current);
      obsRef.current = null;
    };
  }, [isEnglish]);

  const activate = useCallback(async () => {
    setStatus('loading');
    try {
      const nodes = getBengaliNodes(document.body);
      const texts = [...new Set(nodes.map((n) => (n.nodeValue || '').trim()).filter(Boolean))];

      await translateBatch(texts, cache.current);

      applying.current = true;
      applyFromCache(nodes, cache.current);
      setTimeout(() => { applying.current = false; }, 0);

      setIsEnglish(true);
      setStatus('done');
    } catch (err) {
      console.error('[Translate] activate error:', err);
      setStatus('error');
    }
  }, []);

  const restore = useCallback(() => {
    obsRef.current?.disconnect();
    clearTimeout(newContentTimer.current);
    // Clear cache so stale data doesn't interfere after restore
    sessionStorage.removeItem(CACHE_KEY);
    window.location.reload();
  }, []);

  return { isEnglish, status, activate, restore };
}
