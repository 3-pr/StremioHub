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
});
