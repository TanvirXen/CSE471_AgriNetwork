import { useState, useRef, useCallback, useEffect } from 'react';

// Bengali Unicode block
const HAS_BENGALI = /[\u0980-\u09FF]/;

// Nodes whose content we never touch
const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'iframe', 'code', 'pre', 'textarea']);

const SESSION_KEY = 'agri_bn2en_v1';
const BATCH_CHAR_LIMIT = 400;
const SEP = ' ||| ';

// ---------- cache helpers ----------
function loadCache() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}'); }
  catch { return {}; }
}
function saveCache(c) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(c)); }
  catch {}
}

// ---------- MyMemory API (free, no key) ----------
async function callMyMemory(texts) {
  const query = texts.join(SEP);
  const url =
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=bn|en`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  const json = await res.json();
  if (json.responseStatus !== 200) throw new Error(json.responseDetails);
  const parts = json.responseData.translatedText.split(SEP);
  const result = {};
  texts.forEach((t, i) => { result[t] = (parts[i] ?? t).trim() || t; });
  return result;
}

// Split texts into batches that stay under BATCH_CHAR_LIMIT chars each
function makeBatches(texts) {
  const batches = [];
  let cur = [], len = 0;
  for (const t of texts) {
    if (len + t.length + SEP.length > BATCH_CHAR_LIMIT && cur.length) {
      batches.push(cur);
      cur = []; len = 0;
    }
    cur.push(t);
    len += t.length + SEP.length;
  }
  if (cur.length) batches.push(cur);
  return batches;
}

async function translateTexts(texts, cache) {
  const uncached = texts.filter(t => HAS_BENGALI.test(t) && cache[t] === undefined);
  if (!uncached.length) return;

  const batches = makeBatches(uncached);
  // sequential to avoid hammering the free API
  for (const batch of batches) {
    try {
      const result = await callMyMemory(batch);
      Object.assign(cache, result);
    } catch {
      batch.forEach(t => { cache[t] = t; }); // fallback: keep original
    }
  }
  saveCache(cache);
}

// ---------- DOM helpers ----------
function walkTextNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.nodeValue?.trim();
      if (!text || text.length < 2) return NodeFilter.FILTER_REJECT;
      const el = node.parentElement;
      if (!el) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(el.tagName?.toLowerCase())) return NodeFilter.FILTER_REJECT;
      if (el.closest?.('[translate="no"], .translate-no, .translate-toggle'))
        return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  return nodes;
}

function applyCache(cache) {
  const nodes = walkTextNodes(document.body);
  nodes.forEach(node => {
    const orig = node.nodeValue?.trim();
    if (orig && cache[orig]) {
      // Preserve leading/trailing whitespace
      const lead = node.nodeValue.match(/^\s*/)?.[0] ?? '';
      const trail = node.nodeValue.match(/\s*$/)?.[0] ?? '';
      node.nodeValue = lead + cache[orig] + trail;
    }
  });
}

// ---------- public hook ----------
export function usePageTranslator() {
  const [isEnglish, setIsEnglish] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const cache = useRef(loadCache());
  const applying = useRef(false);
  const observerRef = useRef(null);

  // Debounced re-apply for MutationObserver
  const debounceRef = useRef(null);
  const scheduleApply = useCallback(() => {
    if (applying.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applying.current = true;
      applyCache(cache.current);
      // reset flag after microtasks flush
      setTimeout(() => { applying.current = false; }, 0);
    }, 120);
  }, []);

  // Start observer when English is active
  useEffect(() => {
    if (!isEnglish) return;
    const obs = new MutationObserver((mutations) => {
      if (applying.current) return;
      const hasRelevant = mutations.some(
        m => m.type === 'childList' || m.type === 'characterData'
      );
      if (hasRelevant) scheduleApply();
    });
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    observerRef.current = obs;
    return () => {
      obs.disconnect();
      clearTimeout(debounceRef.current);
      observerRef.current = null;
    };
  }, [isEnglish, scheduleApply]);

  const activate = useCallback(async () => {
    setStatus('loading');
    try {
      const nodes = walkTextNodes(document.body);
      const unique = [...new Set(nodes.map(n => n.nodeValue?.trim()).filter(Boolean))];
      await translateTexts(unique, cache.current);

      applying.current = true;
      applyCache(cache.current);
      setTimeout(() => { applying.current = false; }, 0);

      setIsEnglish(true);
      setStatus('done');
    } catch (err) {
      console.error('Translation failed:', err);
      setStatus('error');
    }
  }, []);

  const restore = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    clearTimeout(debounceRef.current);
    // Reload to cleanly restore — DOM state is complex to manually revert
    // across hundreds of dynamic React nodes
    window.location.reload();
  }, []);

  return { isEnglish, status, activate, restore };
}
