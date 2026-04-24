import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BENGALI = /[\u0980-\u09FF]/;
const ENGLISH = /[A-Za-z]/;
const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'iframe', 'code', 'pre']);
const SKIP_SELECTOR = '[translate="no"], .translate-toggle, .translate-no';
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'];
const BUTTON_INPUT_TYPES = new Set(['button', 'submit', 'reset']);
const CACHE_KEY = 'agri_translate_cache_v4';
const LANGUAGE_KEY = 'agri_translate_language_v1';
const REQUEST_CONCURRENCY = 4;

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function persistJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or private mode failures.
  }
}

function loadLanguagePreference() {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  return saved === 'bn' ? 'bn' : 'en';
}

function persistLanguagePreference(language) {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Ignore storage failures.
  }
}

function detectLanguage(text) {
  if (!text) return null;
  if (BENGALI.test(text)) return 'bn';
  if (ENGLISH.test(text)) return 'en';
  return null;
}

function buildCacheKey(sourceLanguage, targetLanguage, text) {
  return `${sourceLanguage}|${targetLanguage}|${text}`;
}

async function fetchTranslation(text, sourceLanguage, targetLanguage) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url =
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage}|${targetLanguage}`;
    const response = await fetch(url, { signal: controller.signal });
    const payload = await response.json();
    const translatedText = payload?.responseData?.translatedText?.trim();

    clearTimeout(timeoutId);

    if (!translatedText || translatedText === text) {
      return null;
    }

    if (targetLanguage === 'en' && BENGALI.test(translatedText)) {
      return null;
    }

    if (targetLanguage === 'bn' && !BENGALI.test(translatedText) && sourceLanguage === 'en') {
      return null;
    }

    return translatedText;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

async function fillTranslationCache(entries, cache) {
  const buckets = new Map();

  entries.forEach(({ originalText, sourceLanguage, targetLanguage }) => {
    const cacheKey = buildCacheKey(sourceLanguage, targetLanguage, originalText);
    if (cache[cacheKey]) return;

    const bucketKey = `${sourceLanguage}|${targetLanguage}`;
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }

    const bucket = buckets.get(bucketKey);
    if (!bucket.includes(originalText)) {
      bucket.push(originalText);
    }
  });

  for (const [bucketKey, texts] of buckets.entries()) {
    const [sourceLanguage, targetLanguage] = bucketKey.split('|');

    for (let index = 0; index < texts.length; index += REQUEST_CONCURRENCY) {
      const slice = texts.slice(index, index + REQUEST_CONCURRENCY);
      const translations = await Promise.all(
        slice.map((text) => fetchTranslation(text, sourceLanguage, targetLanguage))
      );

      slice.forEach((text, sliceIndex) => {
        const translatedText = translations[sliceIndex];
        if (!translatedText) return;
        cache[buildCacheKey(sourceLanguage, targetLanguage, text)] = translatedText;
      });

      persistJson(CACHE_KEY, cache);
    }
  }
}

function shouldSkipElement(element) {
  if (!element) return true;

  const tagName = element.tagName?.toLowerCase();
  if (tagName && SKIP_TAGS.has(tagName)) return true;
  if (element.closest(SKIP_SELECTOR)) return true;

  return false;
}

function rememberTextOriginal(trackers, node, originalValue) {
  if (!trackers.textOriginals.has(node)) {
    trackers.textOriginals.set(node, originalValue);
    trackers.trackedTextNodes.add(node);
  }

  return trackers.textOriginals.get(node);
}

function rememberAttributeOriginal(trackers, element, attributeName, originalValue) {
  if (!trackers.attributeOriginals.has(element)) {
    trackers.attributeOriginals.set(element, new Map());
    trackers.trackedAttributeElements.add(element);
  }

  const attributeMap = trackers.attributeOriginals.get(element);
  if (!attributeMap.has(attributeName)) {
    attributeMap.set(attributeName, originalValue);
  }

  return attributeMap.get(attributeName);
}

function setTranslatedTextNode(node, originalValue, translatedValue) {
  const leadingWhitespace = originalValue.match(/^\s*/)?.[0] ?? '';
  const trailingWhitespace = originalValue.match(/\s*$/)?.[0] ?? '';
  node.nodeValue = `${leadingWhitespace}${translatedValue}${trailingWhitespace}`;
}

function setTranslatedAttribute(element, attributeName, translatedValue) {
  if (attributeName === 'value') {
    element.value = translatedValue;
    return;
  }

  element.setAttribute(attributeName, translatedValue);
}

function restoreOriginalDom(trackers) {
  trackers.trackedTextNodes.forEach((node) => {
    if (!node?.isConnected) {
      trackers.trackedTextNodes.delete(node);
      trackers.textOriginals.delete(node);
      return;
    }

    const originalValue = trackers.textOriginals.get(node);
    if (typeof originalValue === 'string') {
      node.nodeValue = originalValue;
    }
  });

  trackers.trackedAttributeElements.forEach((element) => {
    if (!element?.isConnected) {
      trackers.trackedAttributeElements.delete(element);
      trackers.attributeOriginals.delete(element);
      return;
    }

    const attributeMap = trackers.attributeOriginals.get(element);
    if (!attributeMap) return;

    attributeMap.forEach((originalValue, attributeName) => {
      if (attributeName === 'value') {
        element.value = originalValue || '';
        return;
      }

      if (originalValue === null || originalValue === undefined) {
        element.removeAttribute(attributeName);
        return;
      }

      element.setAttribute(attributeName, originalValue);
    });
  });
}

function collectCandidatesFromRoot(root, targetLanguage, trackers) {
  const candidates = [];

  if (!root) return candidates;

  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parentElement = node.parentElement;
      if (!parentElement || shouldSkipElement(parentElement)) {
        return NodeFilter.FILTER_REJECT;
      }

      const currentValue = node.nodeValue || '';
      const originalValue = rememberTextOriginal(trackers, node, currentValue);
      const normalizedOriginalValue = originalValue.trim();

      if (normalizedOriginalValue.length < 2) {
        return NodeFilter.FILTER_REJECT;
      }

      const sourceLanguage = detectLanguage(normalizedOriginalValue);
      if (!sourceLanguage || sourceLanguage === targetLanguage) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let currentNode;
  while ((currentNode = textWalker.nextNode())) {
    const originalValue = trackers.textOriginals.get(currentNode);
    const originalText = originalValue.trim();
    const sourceLanguage = detectLanguage(originalText);

    if (!sourceLanguage || sourceLanguage === targetLanguage) {
      continue;
    }

    candidates.push({
      type: 'text',
      node: currentNode,
      originalValue,
      originalText,
      sourceLanguage,
      targetLanguage,
    });
  }

  const rootElement = root.nodeType === Node.ELEMENT_NODE ? root : root.parentElement;
  const elements = rootElement
    ? [rootElement, ...rootElement.querySelectorAll('*')]
    : [];

  elements.forEach((element) => {
    if (shouldSkipElement(element)) return;

    TRANSLATABLE_ATTRS.forEach((attributeName) => {
      if (!element.hasAttribute(attributeName)) return;

      const currentValue = element.getAttribute(attributeName) || '';
      const originalValue = rememberAttributeOriginal(trackers, element, attributeName, currentValue);
      const originalText = originalValue.trim();
      const sourceLanguage = detectLanguage(originalText);

      if (!sourceLanguage || sourceLanguage === targetLanguage || originalText.length < 2) {
        return;
      }

      candidates.push({
        type: 'attribute',
        element,
        attributeName,
        originalText,
        sourceLanguage,
        targetLanguage,
      });
    });

    if (element.tagName?.toLowerCase() === 'input') {
      const inputType = (element.getAttribute('type') || 'text').toLowerCase();
      if (!BUTTON_INPUT_TYPES.has(inputType)) return;

      const currentValue = element.value || '';
      const originalValue = rememberAttributeOriginal(trackers, element, 'value', currentValue);
      const originalText = originalValue.trim();
      const sourceLanguage = detectLanguage(originalText);

      if (!sourceLanguage || sourceLanguage === targetLanguage || originalText.length < 2) {
        return;
      }

      candidates.push({
        type: 'attribute',
        element,
        attributeName: 'value',
        originalText,
        sourceLanguage,
        targetLanguage,
      });
    }
  });

  return candidates;
}

export function usePageTranslator() {
  const location = useLocation();
  const [language, setLanguage] = useState(loadLanguagePreference);
  const [status, setStatus] = useState('idle');
  const cache = useRef(loadJson(CACHE_KEY, {}));
  const applying = useRef(false);
  const scanTimer = useRef(null);
  const languageRef = useRef(language);
  const trackers = useRef({
    textOriginals: new Map(),
    trackedTextNodes: new Set(),
    attributeOriginals: new Map(),
    trackedAttributeElements: new Set(),
  });

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const translateRoots = useCallback(async (roots, targetLanguage) => {
    const seenTextNodes = new Set();
    const seenAttributes = new Map();
    const candidates = [];

    roots
      .filter((root) => root && (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.TEXT_NODE))
      .forEach((root) => {
        const normalizedRoot =
          root.nodeType === Node.TEXT_NODE ? root.parentElement : root;
        if (!normalizedRoot) return;

        collectCandidatesFromRoot(normalizedRoot, targetLanguage, trackers.current).forEach((candidate) => {
          if (candidate.type === 'text') {
            if (seenTextNodes.has(candidate.node)) return;
            seenTextNodes.add(candidate.node);
            candidates.push(candidate);
            return;
          }

          const attributeKey = `${candidate.attributeName}:${candidate.originalText}`;
          let attributeSet = seenAttributes.get(candidate.element);
          if (!attributeSet) {
            attributeSet = new Set();
            seenAttributes.set(candidate.element, attributeSet);
          }
          if (attributeSet.has(attributeKey)) return;
          attributeSet.add(attributeKey);
          candidates.push(candidate);
        });
      });

    if (!candidates.length) {
      return 0;
    }

    await fillTranslationCache(candidates, cache.current);

    applying.current = true;
    let appliedCount = 0;

    candidates.forEach((candidate) => {
      const translatedText =
        cache.current[buildCacheKey(candidate.sourceLanguage, candidate.targetLanguage, candidate.originalText)];
      if (!translatedText) return;

      if (candidate.type === 'text') {
        if (!candidate.node?.isConnected) return;
        setTranslatedTextNode(candidate.node, candidate.originalValue, translatedText);
      } else {
        if (!candidate.element?.isConnected) return;
        setTranslatedAttribute(candidate.element, candidate.attributeName, translatedText);
      }

      appliedCount += 1;
    });

    setTimeout(() => {
      applying.current = false;
    }, 0);

    return appliedCount;
  }, []);

  const syncWholeDocument = useCallback(
    async (targetLanguage, { showLoading = false } = {}) => {
      if (!document.body) return;

      if (showLoading) {
        setStatus('loading');
      }

      try {
        applying.current = true;
        restoreOriginalDom(trackers.current);
        await translateRoots([document.body], targetLanguage);
        setStatus('done');
      } catch (error) {
        console.error('[Translate] sync error:', error);
        setStatus('error');
      } finally {
        setTimeout(() => {
          applying.current = false;
        }, 0);
      }
    },
    [translateRoots]
  );

  const scheduleTranslate = useCallback(
    (roots = [document.body], delay = 150) => {
      clearTimeout(scanTimer.current);
      scanTimer.current = setTimeout(async () => {
        if (applying.current) return;

        try {
          await translateRoots(roots, languageRef.current);
        } catch (error) {
          console.error('[Translate] background sync error:', error);
        }
      }, delay);
    },
    [translateRoots]
  );

  useEffect(() => {
    if (!document.body) return;

    const observer = new MutationObserver((mutations) => {
      if (applying.current) return;

      const roots = new Set();
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') {
          if (mutation.target?.parentElement) {
            roots.add(mutation.target.parentElement);
          }
          return;
        }

        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            roots.add(node);
          } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
            roots.add(node.parentElement);
          }
        });
      });

      if (roots.size > 0) {
        scheduleTranslate([...roots]);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      clearTimeout(scanTimer.current);
    };
  }, [scheduleTranslate]);

  useEffect(() => {
    syncWholeDocument(language, { showLoading: true });
  }, [language, location.pathname, syncWholeDocument]);

  const toggleLanguage = useCallback(() => {
    setLanguage((currentLanguage) => {
      const nextLanguage = currentLanguage === 'en' ? 'bn' : 'en';
      persistLanguagePreference(nextLanguage);
      return nextLanguage;
    });
  }, []);

  return {
    language,
    isEnglish: language === 'en',
    status,
    toggleLanguage,
  };
}
