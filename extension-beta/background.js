// background.js — StremioHub Service Worker

// ==================== Context Menu ====================
async function updateContextMenu() {
  const { language } = await chrome.storage.local.get('language');
  const lang = language || 'ar';
  const title = lang === 'en' 
    ? '🔍 Search Stremio for "%s"' 
    : '🔍 ابحث عن "%s" في Stremio';
  
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'search-stremio',
      title: title,
      contexts: ['selection']
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  updateContextMenu();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.language) {
    updateContextMenu();
  }
});

// ==================== Context Menu Click ====================
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'search-stremio') {
    const query = info.selectionText?.trim();
    if (!query) return;

    // خزّن الـ query ثم افتح الـ Popup
    await chrome.storage.session.set({ pendingSearch: query });

    // حاول فتح الـ Popup — إذا فشل (بعض المتصفحات لا تدعم openPopup من service worker)
    // نفتح tab جديد مع Stremio Web search
    try {
      await chrome.action.openPopup();
    } catch {
      // fallback: افتح بحث على Stremio Web
      const encoded = encodeURIComponent(query);
      await chrome.tabs.create({
        url: `https://web.stremio.com/#/search?search=${encoded}`
      });
    }
  }
});

import { StremioAPI } from './modules/stremio-api.js';

// ==================== Message Listener ====================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_AUTH') {
    (async () => {
      const result = await chrome.storage.local.get(['stremio_auth']);
      sendResponse(result.stremio_auth || null);
    })();
    return true; // async response
  }

  if (message.type === 'OPEN_STREMIO_WEB') {
    const { imdbId, mediaType, videoId } = message;
    const url = videoId 
      ? `https://web.stremio.com/#/detail/${mediaType}/${imdbId}/${videoId}`
      : `https://web.stremio.com/#/detail/${mediaType}/${imdbId}`;
    chrome.tabs.create({ url });
  }

  if (message.type === 'OPEN_STREMIO_APP') {
    const { imdbId, mediaType, videoId } = message;
    const url = videoId
      ? `stremio:///detail/${mediaType}/${imdbId}/${videoId}`
      : `stremio:///detail/${mediaType}/${imdbId}`;
    chrome.tabs.create({ url });
  }

  if (message.type === 'SEARCH_IN_POPUP') {
    (async () => {
      await chrome.storage.session.set({ pendingSearch: message.query });
      try { await chrome.action.openPopup(); } catch {}
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message.type === 'ADD_TO_LIBRARY') {
    (async () => {
      try {
        const { stremio_auth } = await chrome.storage.local.get(['stremio_auth']);
        if (!stremio_auth?.authKey) throw new Error('Not logged in');

        let itemMeta = null;
        
        // If imdbId is provided directly, we can fetch exactly
        if (message.imdbId) {
          const type = message.mediaType || 'movie';
          const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${message.imdbId}.json`);
          if (metaRes.ok) {
            const data = await metaRes.json();
            if (data.meta) itemMeta = data.meta;
          }
        } 
        
        // Otherwise search cinemeta by title
        if (!itemMeta && message.query) {
          const type = message.mediaType || 'movie';
          const searchRes = await fetch(`https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(message.query)}.json`);
          if (searchRes.ok) {
            const data = await searchRes.json();
            let matched = data.metas?.[0];
            if (message.year && data.metas) {
              const exact = data.metas.find(m => m.year == message.year || (m.releaseInfo && m.releaseInfo.includes(message.year)));
              if (exact) matched = exact;
            }
            if (matched) {
              // Fetch full meta
              const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${matched.id}.json`);
              if (metaRes.ok) {
                const fullData = await metaRes.json();
                if (fullData.meta) itemMeta = fullData.meta;
              } else {
                itemMeta = matched;
              }
            }
          }
        }

        if (!itemMeta) {
          // Fallback minimal meta if cinemeta fails
          itemMeta = {
            id: message.imdbId || `custom:${Date.now()}`,
            name: message.query,
            type: message.mediaType || 'movie',
            year: message.year || ''
          };
        }

        const success = await StremioAPI.addToLibrary(stremio_auth.authKey, itemMeta);
        
        // Invalidate library cache
        await chrome.storage.local.remove(['library_cache']);

        sendResponse({ success, itemMeta });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'OPEN_IN_STREMIO_DIRECT') {
    (async () => {
      try {
        let imdbId = message.imdbId;
        const type = message.mediaType || 'movie';
        
        if (!imdbId && message.query) {
          const searchRes = await fetch(`https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(message.query)}.json`);
          if (searchRes.ok) {
            const data = await searchRes.json();
            let matched = data.metas?.[0];
            if (message.year && data.metas) {
              const exact = data.metas.find(m => m.year == message.year || (m.releaseInfo && m.releaseInfo.includes(message.year)));
              if (exact) matched = exact;
            }
            if (matched) imdbId = matched.id;
          }
        }

        if (!imdbId) throw new Error('Could not find item in Stremio catalog');

        const { openMethod } = await chrome.storage.local.get(['openMethod']);
        const method = openMethod || 'web';
        
        const url = method === 'app' 
          ? `stremio:///detail/${type}/${imdbId}`
          : `https://web.stremio.com/#/detail/${type}/${imdbId}`;
          
        await chrome.tabs.create({ url });
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // ==================== Ratings API Handlers ====================

  if (message.type === 'FETCH_RATINGS') {
    (async () => {
      const { imdbId } = message;
      if (!imdbId || !/^tt\d+$/.test(imdbId)) {
        sendResponse({ error: 'invalid_id' });
        return;
      }

      // ── طبقة الكاش (session storage — يُمسح عند إغلاق المتصفح) ──
      const cacheKey = `sh_ratings_${imdbId}`;
      try {
        const cached = await chrome.storage.session.get(cacheKey);
        if (cached[cacheKey]) {
          sendResponse({ ratings: cached[cacheKey], fromCache: true });
          return;
        }
      } catch (_) { /* session storage اختياري */ }

      // ── قراءة الإعدادات ──
      const settings = await chrome.storage.local.get([
        'ratingsEnabled',
        'ratingsSource',
        'mdblistApiKey',
        'publicmetadbApiKey'
      ]);

      if (settings.ratingsEnabled === false) {
        sendResponse({ error: 'disabled' });
        return;
      }

      const source = settings.ratingsSource || 'mdblist';
      let ratingsData = null;
      let fetchError  = null;

      try {
        if (source === 'mdblist') {
          ratingsData = await fetchFromMDBList(settings.mdblistApiKey, imdbId);
        } else if (source === 'publicmetadb') {
          // نمرر mediaType (movie أو series) لأن PublicMetaDB يحتاجه
          const mediaType = message.mediaType || 'movie';
          ratingsData = await fetchFromPublicMetaDB(settings.publicmetadbApiKey, imdbId, mediaType);
        }
      } catch (err) {
        fetchError = err.message;
      }

      if (!ratingsData) {
        sendResponse({ error: fetchError || 'no_data' });
        return;
      }

      // ── حفظ في الكاش ──
      try {
        await chrome.storage.session.set({ [cacheKey]: ratingsData });
      } catch (_) { /* تجاهل فشل الكاش */ }

      sendResponse({ ratings: ratingsData });
    })();
    return true; // يُبلغ Chrome أن الرد سيكون async
  }

  if (message.type === 'TEST_RATINGS_API') {
    (async () => {
      const { source, apiKey } = message;
      const testImdbId = 'tt0111161'; // The Shawshank Redemption
      try {
        let result = null;
        if (source === 'mdblist') {
          result = await fetchFromMDBList(apiKey, testImdbId);
        } else if (source === 'publicmetadb') {
          result = await fetchFromPublicMetaDB(apiKey, testImdbId);
        }
        sendResponse({ ok: !!result, count: result?.ratings?.length || 0 });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }
});

// ==================== Ratings API Helpers ====================

async function fetchFromMDBList(apiKey, imdbId) {
  if (!apiKey) throw new Error('mdblist_no_key');
  // ✅ mdblist.com/api/ هو العنوان الصحيح (api.mdblist.com للـ OAuth فقط)
  const url = `https://mdblist.com/api/?apikey=${apiKey}&i=${imdbId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`mdblist_http_${res.status}`);
  const data = await res.json();
  if (data.response === false || data.error === true) {
    throw new Error(data.error_message || data.error || 'mdblist_api_error');
  }
  return parseMDBList(data);
}


async function fetchFromPublicMetaDB(apiKey, imdbId, mediaType = 'movie') {
  if (!apiKey) throw new Error('publicmetadb_no_key');

  // 1. جلب tmdb_id عبر Cinemeta لأن PublicMetaDB يحتاج TMDB ID
  const cinemetaUrl = `https://v3-cinemeta.strem.io/meta/${mediaType}/${imdbId}.json`;
  let tmdbId = null;
  let title = '';
  let year = '';

  try {
    const cinemetaRes = await fetch(cinemetaUrl);
    if (cinemetaRes.ok) {
      const cinemetaData = await cinemetaRes.json();
      tmdbId = cinemetaData?.meta?.moviedb_id;
      title = cinemetaData?.meta?.name || '';
      year = cinemetaData?.meta?.year || '';
    }
  } catch (_) {
    // تجاهل أخطاء cinemeta، سنلقي خطأ إذا لم نجد tmdbId
  }

  if (!tmdbId) {
    throw new Error('publicmetadb_no_tmdb_id');
  }

  // 2. طلب التقييمات من الـ API الرسمي الجديد
  // PublicMetaDB يقبل 'movie' أو 'tv' فقط
  const pmMediaType = mediaType === 'series' ? 'tv' : mediaType;
  const url = `https://publicmetadb.com/api/external/ratings?tmdb_id=${tmdbId}&media_type=${pmMediaType}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) throw new Error(`publicmetadb_http_${res.status}`);
  
  const data = await res.json();
  return parsePublicMetaDB(data, title, year);
}

function parseMDBList(data) {
  if (!data) return null;
  const ratings = [];

  // ── البنية الجديدة: ratings هي مصفوفة [{source, value, score, votes}] ──
  if (Array.isArray(data.ratings) && data.ratings.length > 0) {
    const SOURCE_MAP = {
      // source key      label          max   icon  useScore (بعض القيم كـ letterboxd تكون من 5)
      'imdb':            { label: 'IMDb',        max: 10,  icon: '⭐', useValue: true  },
      'tomatoes':        { label: 'RT',          max: 100, icon: '🍅', useValue: true  },
      'tomatoesaudience':{ label: 'RT Aud',      max: 100, icon: '🍿', useValue: true  },
      'metacritic':      { label: 'Metacritic',  max: 100, icon: '🎯', useValue: true  },
      'metacriticuser':  { label: 'MC User',     max: 10,  icon: '👤', useValue: true  },
      'trakt':           { label: 'Trakt',       max: 100, icon: '📺', useValue: true  },
      'tmdb':            { label: 'TMDB',        max: 100, icon: '🎭', useValue: true  },
      'letterboxd':      { label: 'Letterboxd',  max: 5,   icon: '🎬', useValue: true  },
      'rogerebert':      { label: 'Ebert',       max: 4,   icon: '🎥', useValue: true  },
    };
    for (const r of data.ratings) {
      const key = r.source?.toLowerCase();
      const map = SOURCE_MAP[key];
      // r.value هو القيمة الأصلية، r.score هو من 100 دائماً
      const val = r.value;
      if (map && val != null) {
        ratings.push({ source: map.label, score: val, max: map.max, icon: map.icon });
      }
    }
  } else {
    // ── البنية القديمة: حقول مستقلة ──
    if (data.imdbrating    != null) ratings.push({ source: 'IMDb',       score: data.imdbrating,    max: 10,  icon: '⭐' });
    if (data.tomatoesmeter != null) ratings.push({ source: 'RT',         score: data.tomatoesmeter, max: 100, icon: '🍅' });
    if (data.metacritic    != null) ratings.push({ source: 'Metacritic', score: data.metacritic,    max: 100, icon: '🎯' });
    if (data.letterboxd    != null) ratings.push({ source: 'Letterboxd', score: data.letterboxd,    max: 5,   icon: '🎬' });
    if (data.trakt         != null) ratings.push({ source: 'Trakt',      score: data.trakt,         max: 100, icon: '📺' });
    if (data.rogerebert    != null) ratings.push({ source: 'Ebert',      score: data.rogerebert,    max: 4,   icon: '🎥' });
  }

  if (ratings.length === 0) return null;
  return { source: 'mdblist', title: data.title || '', year: data.year || '', ratings };
}

function parsePublicMetaDB(data, title, year) {
  if (!data || !data.items) return null;
  
  const LABEL_MAP = {
    'IM': { label: 'IMDb', max: 10, icon: '⭐' },
    'RT': { label: 'RT', max: 100, icon: '🍅' },
    'PC': { label: 'RT Aud', max: 100, icon: '🍿' },
    'MC': { label: 'Metacritic', max: 100, icon: '🎯' },
    'TR': { label: 'Trakt', max: 100, icon: '📺' },
    'TM': { label: 'TMDB', max: 100, icon: '🎭' },
    'LB': { label: 'Letterboxd', max: 5, icon: '🎬' },
    'RE': { label: 'Ebert', max: 4, icon: '🎥' }
  };

  // تجميع التقييمات وحساب المتوسط لكل منصة
  const grouped = {};
  for (const item of data.items) {
    const lbl = item.label || 'Overall';
    if (!grouped[lbl]) grouped[lbl] = [];
    grouped[lbl].push(item.score);
  }

  const ratings = [];

  // تقييم مجتمع PublicMetaDB العام
  if (data.average != null) {
    ratings.push({ source: 'PublicMeta', score: data.average, max: 100, icon: '🌐' });
  }

  // التقييمات الخارجية (تحويل السكور من % إلى النظام الأصلي)
  for (const [lbl, scores] of Object.entries(grouped)) {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length; // من 100
    const map = LABEL_MAP[lbl];
    if (map) {
      // إذا كان التقييم مثلاً 93 والماكس الخاص به 10 (مثل IMDb) نرجعه إلى 9.3
      let finalScore = avgScore;
      if (map.max && map.max !== 100) {
        finalScore = (avgScore * (map.max / 100));
        // تقريب لمنزلة عشرية واحدة إذا كان ماكس 10 أو 5
        finalScore = Number(finalScore.toFixed(1)); 
      }
      ratings.push({ source: map.label, score: finalScore, max: map.max, icon: map.icon });
    }
  }

  if (ratings.length === 0) return null;
  return { source: 'publicmetadb', title: title || 'PublicMetaDB', year: year || '', ratings };
}
