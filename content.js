// content.js — يُحقن في مواقع التقييم وبحث جوجل ويضيف زر Stremio

(function () {
  'use strict';

  const hostname = window.location.hostname;
  const href = window.location.href;

  // ==================== Site Detectors ====================

  const detectors = {
    google: {
      match: () => hostname.includes('google.com') && href.includes('/search'),
      inject: injectGoogle
    },
    letterboxd: {
      match: () => hostname.includes('letterboxd.com') && href.includes('/film/'),
      inject: injectLetterboxd
    },
    imdb: {
      match: () => hostname.includes('imdb.com') && /\/title\/tt\d+/.test(href),
      inject: injectIMDB
    },
    tmdb: {
      match: () => hostname.includes('themoviedb.org') && (href.includes('/movie/') || href.includes('/tv/')),
      inject: injectTMDB
    },
    rt: {
      match: () => hostname.includes('rottentomatoes.com') && (href.includes('/m/') || href.includes('/tv/')),
      inject: injectRT
    },
    metacritic: {
      match: () => hostname.includes('metacritic.com') && (href.includes('/movie/') || href.includes('/tv/')),
      inject: injectMetacritic
    }
  };

  // ==================== Main Init ====================

  async function init() {
    if (document.getElementById('stremio-hub-btn') || document.getElementById('stremio-google-btn')) return;

    const stored = await chrome.storage.local.get(['sitesEnabled', 'siteActions']);
    const sitesEnabled = stored.sitesEnabled || {
      google: true, letterboxd: true, imdb: true, tmdb: true, rt: true, metacritic: true
    };
    const siteActions = stored.siteActions || {
      google: 'save', letterboxd: 'save', imdb: 'save', tmdb: 'save', rt: 'save', metacritic: 'save'
    };

    for (const [key, detector] of Object.entries(detectors)) {
      if (detector.match() && sitesEnabled[key] !== false) {
        detector.inject(siteActions[key] || 'save');
        break;
      }
    }
  }

  // ==================== Google Search ====================
  function injectGoogle(action = 'save') {
    if (document.getElementById('stremio-google-btn')) return;

    // Get Title and Type from Knowledge Panel
    const titleEl = document.querySelector('[data-attrid="title"]') || document.querySelector('h2[data-attrid="title"]');
    const title = titleEl?.textContent?.trim();
    const subtitleEl = document.querySelector('[data-attrid="subtitle"]');
    const subtitle = subtitleEl?.textContent?.toLowerCase() || '';
    const type = (subtitle.includes('tv') || subtitle.includes('series')) ? 'series' : 'movie';
    const year = subtitle.match(/\\d{4}/)?.[0];

    if (!title) return;

    // Try to get IMDB ID from DOM for perfect matching
    let imdbLink = document.querySelector("a[href*='https://www.imdb.com/title']")?.href || document.querySelector("a[href*='https://m.imdb.com/title']")?.href;
    const imdbIdMatch = imdbLink?.match(new RegExp('/title/(tt\d+)'));
    const imdbId = imdbIdMatch ? imdbIdMatch[1] : null;

    const iconUrl = chrome.runtime.getURL('icons/stremio-icon.png');
    const btnText = action === 'open' ? 'Open in Stremio' : 'Save to Stremio';

    const handleStremioClick = async (e, statusSpan, feedbackCallback) => {
      e.preventDefault();

      if (action === 'open') {
        if (statusSpan) statusSpan.textContent = 'Opening...';
        chrome.runtime.sendMessage({
          type: 'OPEN_IN_STREMIO_DIRECT',
          query: title, year, mediaType: type, imdbId
        }, (res) => {
          if (feedbackCallback) feedbackCallback(res && res.success);
          if (statusSpan) {
            if (res && res.success) {
              statusSpan.textContent = 'Opened ✓';
            } else {
              statusSpan.textContent = 'Error';
            }
            setTimeout(() => {
              statusSpan.textContent = btnText;
              statusSpan.style.color = 'inherit';
            }, 3000);
          }
        });
        return;
      }

      const stored = await chrome.storage.local.get('autoSave');
      const autoSave = stored.autoSave !== false;

      if (autoSave) {
        if (statusSpan) statusSpan.textContent = 'Saving...';
        chrome.runtime.sendMessage({
          type: 'ADD_TO_LIBRARY',
          query: title, year, mediaType: type, imdbId
        }, (res) => {
          if (feedbackCallback) feedbackCallback(res && res.success);
          if (statusSpan) {
            if (res && res.success) {
              statusSpan.textContent = 'Saved!';
              statusSpan.style.color = '#34d399';
            } else {
              statusSpan.textContent = 'Error';
              statusSpan.style.color = '#f87171';
            }
            setTimeout(() => {
              statusSpan.textContent = btnText;
              statusSpan.style.color = 'inherit';
            }, 3000);
          }
        });
      } else {
        if (statusSpan) statusSpan.textContent = 'Loading...';
        chrome.runtime.sendMessage({
          type: 'SEARCH_IN_POPUP',
          query: title, year, mediaType: type
        });
        setTimeout(() => {
          if (statusSpan) {
             statusSpan.textContent = btnText;
             statusSpan.style.color = 'inherit';
          }
        }, 2000);
      }
    };

    // Design Pattern 1: Horizontal List (Mobile/Desktop Watch Now)
    const watchNowMain = document.querySelector("div[role='list'][data-ved][lang]");
    if (watchNowMain) {
      // Hijack the first button
      const mainTag = watchNowMain.querySelector("a[ping]");
      if (mainTag) {
        mainTag.id = 'stremio-google-btn';
        mainTag.href = '#';
        const img = mainTag.querySelector("img");
        if (img) {
          img.src = iconUrl;
          img.style.objectFit = 'cover';
          img.style.borderRadius = '50%';
        }

        const textDiv = mainTag.querySelector('div:nth-child(2)');
        if (textDiv) {
          if (textDiv.firstChild) {
            textDiv.firstChild.textContent = 'Stremio';
            textDiv.firstChild.style.color = '#a78bfa';
            textDiv.firstChild.style.fontWeight = '600';
          }
          if (textDiv.lastChild) {
            textDiv.lastChild.textContent = btnText;
            textDiv.lastChild.classList.add('stremio-status');
            textDiv.lastChild.style.color = 'inherit';
            textDiv.lastChild.style.opacity = '0.8';
            textDiv.lastChild.style.fontWeight = '500';
          }
        }
        mainTag.addEventListener('click', (e) => {
          handleStremioClick(e, textDiv?.lastChild, (isSuccess) => {
            if (img) {
              const color = isSuccess ? '#34d399' : '#f87171';
              img.style.transition = 'all 0.3s ease';
              img.style.boxShadow = `0 0 0 3px ${color}, 0 4px 12px ${color}80`;
              img.style.transform = 'scale(1.1)';
              setTimeout(() => {
                img.style.boxShadow = 'none';
                img.style.transform = 'scale(1)';
              }, 3000);
            }
          });
        });
        return;
      }
    }

    // Design Pattern 2: Wholepage media actions (Desktop)
    let watchOptions = document.querySelectorAll("div[data-attrid='kc:/tv/tv_program:media_actions_wholepage'], div[data-attrid='kc:/film/film:media_actions_wholepage']");
    if (watchOptions.length > 0) {
      let watchOption = watchOptions[0];
      let firstChild = watchOption.firstElementChild?.firstElementChild;
      if (firstChild) {
        let watchNowEle = firstChild.firstElementChild;
        if (watchNowEle) {
          watchNowEle.id = 'stremio-google-btn';
          watchNowEle.innerHTML = `
             <a class="stremio-cta__href" href='#' style="display: flex; align-items: center; padding: 10px 18px; background: rgba(145, 109, 213, 0.1); border: 1px solid rgba(145, 109, 213, 0.4); border-radius: 24px; text-decoration: none; margin-bottom: 12px; transition: all 0.2s ease;">
               <img style='width: 32px; height: 32px; border-radius: 50%; margin-right: 14px; object-fit: cover; box-shadow: 0 2px 6px rgba(0,0,0,0.2);' src="${iconUrl}" />
               <div style="display: flex; flex-direction: column; justify-content: center;">
                 <div style="font-weight: 600; color: #a78bfa; font-family: Roboto, Arial, sans-serif; font-size: 15px; line-height: 1.2;">Stremio</div>
                 <div class="stremio-status" style="font-size: 13px; font-weight: 500; color: inherit; opacity: 0.8; font-family: Roboto, Arial, sans-serif; margin-top: 2px;">${btnText}</div>
               </div>
             </a>`;
          const link = watchNowEle.querySelector('a');
          
          link.addEventListener('mouseenter', () => {
            link.style.background = 'rgba(145, 109, 213, 0.2)';
            link.style.transform = 'translateY(-1px)';
          });
          link.addEventListener('mouseleave', () => {
            link.style.background = 'rgba(145, 109, 213, 0.1)';
            link.style.transform = 'translateY(0)';
          });

          const statusSpan = watchNowEle.querySelector('.stremio-status');
          const img = watchNowEle.querySelector('img');
          link.addEventListener('click', (e) => {
            handleStremioClick(e, statusSpan, (isSuccess) => {
              if (img) {
                const color = isSuccess ? '#34d399' : '#f87171';
                img.style.transition = 'all 0.3s ease';
                img.style.boxShadow = `0 0 0 3px ${color}, 0 4px 12px ${color}80`;
                img.style.transform = 'scale(1.1)';
                setTimeout(() => {
                  img.style.boxShadow = 'none';
                  img.style.transform = 'scale(1)';
                }, 3000);
              }
            });
          });
          return;
        }
      }
    }

    // Fallback if neither exists, but we are on a movie page
    const reviewContainer = document.querySelector("div[data-attrid^='kc:/film/film:'], div[data-attrid^='kc:/tv/tv_program:']");
    if (reviewContainer) {
      // Create a floating action button (FAB) as fallback
      const fabStremio = document.createElement("a");
      fabStremio.id = "stremio-google-btn";
      fabStremio.href = "#";
      fabStremio.innerHTML = `<img style='width: 48px;height: 48px; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: all 0.3s ease;' src="${iconUrl}" />`;
      fabStremio.style.cssText = "position: fixed; bottom: 30px; right: 30px; z-index: 999999; cursor: pointer; transition: 0.2s;";
      
      const img = fabStremio.querySelector('img');

      fabStremio.addEventListener('mouseenter', () => img.style.transform = 'scale(1.1)');
      fabStremio.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');

      fabStremio.addEventListener('click', (e) => {
        handleStremioClick(e, null, (isSuccess) => {
          const color = isSuccess ? '#34d399' : '#f87171';
          img.style.boxShadow = `0 0 0 4px ${color}, 0 6px 16px ${color}80`;
          img.style.transform = 'scale(1.15)';
          setTimeout(() => {
            img.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
            img.style.transform = 'scale(1)';
          }, 3000);
        });
      });
      document.body.appendChild(fabStremio);
    }
  }

  // ==================== Letterboxd ====================

  function injectLetterboxd(action = 'save') {
    if (document.getElementById('stremio-hub-btn')) return;
    const watchElement = document.querySelector('.js-actions-panel');
    if (!watchElement) return;

    let title = document.querySelector('.inline-production-masthead .primaryname a')?.textContent?.trim();
    if (!title) {
      title = document.querySelector('h1.headline-1, .headline-1, h1[class*="title"]')?.textContent?.trim();
    }
    
    let year = document.querySelector('.inline-production-masthead .releasedate a')?.textContent?.trim();
    if (!year) {
      year = document.querySelector('.number[href*="/films/year/"], a[href*="/films/year/"]')?.textContent?.trim();
    }
    
    const type = 'movie';

    if (!title) return;

    const btnText = action === 'open' ? 'Open in Stremio' : 'Save to Stremio';
    const iconUrl = chrome.runtime.getURL('icons/stremio-icon.png');
    const stremioButton = document.createElement('button');
    stremioButton.id = 'stremio-hub-btn';
    stremioButton.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;">
        <img title="Stremio" style="width: 16px; height: 16px; border-radius: 3px; object-fit: cover; box-shadow: 0 1px 3px rgba(0,0,0,0.3);" src="${iconUrl}"/>
        <span style="font-weight: 700; font-size: 11px; color: #99aabb; letter-spacing: 0.08em; text-transform: uppercase; font-family: 'GraphikWeb', -apple-system, sans-serif;">${btnText}</span>
      </div>
    `;
    stremioButton.setAttribute('style', `
      display: block;
      width: 100%;
      cursor: pointer;
      border: 1px solid #303840;
      border-radius: 3px;
      margin-bottom: 12px;
      padding: 10px 8px;
      background-color: #1c2228;
      transition: all 0.15s ease;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    `);

    stremioButton.addEventListener('mouseenter', () => {
      stremioButton.style.backgroundColor = '#26213a';
      stremioButton.style.borderColor = '#7B52C8';
      stremioButton.querySelector('span').style.color = '#c4aaff';
    });
    stremioButton.addEventListener('mouseleave', () => {
      stremioButton.style.backgroundColor = '#1c2228';
      stremioButton.style.borderColor = '#303840';
      stremioButton.querySelector('span').style.color = '#99aabb';
    });

    stremioButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const span = stremioButton.querySelector('span');

      if (action === 'open') {
        span.textContent = 'Opening...';
        chrome.runtime.sendMessage({ type: 'OPEN_IN_STREMIO_DIRECT', query: title, year, mediaType: type }, (res) => {
          if (res && res.success) {
            span.textContent = 'Opened ✓';
          } else {
            span.textContent = 'Failed';
          }
          setTimeout(() => span.textContent = btnText, 3000);
        });
        return;
      }

      const stored = await chrome.storage.local.get('autoSave');
      const autoSave = stored.autoSave !== false;

      if (autoSave) {
        span.textContent = 'Saving...';
        chrome.runtime.sendMessage({ type: 'ADD_TO_LIBRARY', query: title, year, mediaType: type }, (res) => {
          if (res && res.success) {
            span.textContent = 'Saved to Stremio ✓';
            stremioButton.style.borderColor = '#34d399';
            stremioButton.style.backgroundColor = 'rgba(52, 211, 153, 0.15)';
            span.style.color = '#34d399';
          } else {
            span.textContent = 'Failed';
          }
          setTimeout(() => {
            span.textContent = btnText;
            stremioButton.style.borderColor = 'rgba(145, 109, 213, 0.4)';
            stremioButton.style.backgroundColor = 'rgba(145, 109, 213, 0.15)';
            span.style.color = '#e6e6ea';
          }, 3000);
        });
      } else {
        span.textContent = 'Loading...';
        chrome.runtime.sendMessage({ type: 'SEARCH_IN_POPUP', query: title, year, mediaType: type });
        setTimeout(() => {
          span.textContent = btnText;
          stremioButton.style.borderColor = 'rgba(145, 109, 213, 0.4)';
          stremioButton.style.backgroundColor = 'rgba(145, 109, 213, 0.15)';
          span.style.color = '#e6e6ea';
        }, 2000);
      }
    });

    watchElement.insertBefore(stremioButton, watchElement.firstChild);
  }

  // ==================== IMDB ====================

  function injectIMDB(action = 'save') {
    if (document.getElementById('stremio-hub-btn')) return;
    const imdbButton = document.querySelector('[data-testid="tm-box-wl-button"]');
    if (!imdbButton) return;

    const titleEl = document.querySelector('[data-testid="hero__pageTitle"]') || document.querySelector('h1');
    const title = titleEl?.textContent?.trim();
    const yearEl = document.querySelector('a[href*="/releaseinfo"], .sc-8c396aa2-2, [data-testid="title-details-releasedate"] a');
    const year = yearEl?.textContent?.match(/\d{4}/)?.[0];
    const isSeries = document.title.toLowerCase().includes('tv series') || document.title.toLowerCase().includes('tv mini');
    const type = isSeries ? 'series' : 'movie';

    if (!title) return;

    const btnText = action === 'open' ? '▶ Open in Stremio' : '▶ Save to Stremio';

    const stremioButton = document.createElement('button');
    stremioButton.id = 'stremio-hub-btn';
    stremioButton.className = 'circular-strmio-button';
    stremioButton.innerHTML = btnText;

    // Style to look native but distinct (Stremio purple)
    stremioButton.style.cssText = `
      width: 100%;
      background: #7b5ea7;
      color: white;
      border: none;
      border-radius: 24px;
      padding: 10px 16px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background 0.2s, transform 0.2s;
      font-family: Roboto, Helvetica, Arial, sans-serif;
    `;

    stremioButton.addEventListener('mouseenter', () => {
      stremioButton.style.background = '#9070c8';
      stremioButton.style.transform = 'translateY(-1px)';
    });
    stremioButton.addEventListener('mouseleave', () => {
      stremioButton.style.background = '#7b5ea7';
      stremioButton.style.transform = 'translateY(0)';
    });

    stremioButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const imdbIdMatch = window.location.pathname.match(new RegExp('/title/(tt\\\\d+)'));
      const imdbId = imdbIdMatch ? imdbIdMatch[1] : null;

      if (action === 'open') {
        stremioButton.innerHTML = 'Opening...';
        chrome.runtime.sendMessage({ type: 'OPEN_IN_STREMIO_DIRECT', query: title, year, mediaType: type, imdbId }, (res) => {
          if (res && res.success) {
            stremioButton.innerHTML = 'Opened ✓';
          } else {
            stremioButton.innerHTML = 'Failed';
          }
          setTimeout(() => stremioButton.innerHTML = btnText, 3000);
        });
        return;
      }

      const stored = await chrome.storage.local.get('autoSave');
      const autoSave = stored.autoSave !== false;

      if (autoSave) {
        stremioButton.innerHTML = 'Saving...';
        chrome.runtime.sendMessage({ type: 'ADD_TO_LIBRARY', query: title, year, mediaType: type, imdbId }, (res) => {
          if (res && res.success) {
            stremioButton.innerHTML = 'Saved ✓';
            stremioButton.style.background = '#34d399';
          } else {
            stremioButton.innerHTML = 'Failed';
            stremioButton.style.background = '#f87171';
          }
          setTimeout(() => {
            stremioButton.innerHTML = btnText;
            stremioButton.style.background = '#7b5ea7';
          }, 3000);
        });
      } else {
        stremioButton.innerHTML = 'Loading...';
        chrome.runtime.sendMessage({ type: 'SEARCH_IN_POPUP', query: title, year, mediaType: type });
        setTimeout(() => {
          stremioButton.innerHTML = btnText;
          stremioButton.style.background = '#7b5ea7';
        }, 2000);
      }
    });

    // We insert it into the parent container of the IMDB split button, so it stacks neatly.
    const splitBtn = imdbButton.closest('.ipc-split-button') || imdbButton;
    splitBtn.parentNode.insertBefore(stremioButton, splitBtn);
  }

  // ==================== TMDB ====================

  function injectTMDB(action = 'save') {
    if (document.getElementById('stremio-hub-btn')) return;
    const actionsElement = document.querySelector('ul.auto.actions');
    if (!actionsElement) return;

    const title = document.querySelector('.title h2 a, h2.title a, h2 a')?.textContent?.trim() || document.querySelector('h2')?.textContent?.trim();
    const year = document.querySelector('.release_date, .release, .tag')?.textContent?.match(/\d{4}/)?.[0];
    const type = href.includes('/tv/') ? 'series' : 'movie';

    if (!title) return;

    const btnText = action === 'open' ? 'Open in Stremio' : 'Save to Stremio';
    const iconUrl = chrome.runtime.getURL('icons/stremio-icon.png');
    const stremioButton = document.createElement('a');
    stremioButton.id = 'stremio-hub-btn';
    stremioButton.title = btnText;
    stremioButton.innerHTML = `<img alt="${btnText}" style="width: 46px; height: 46px; border-radius: 50%; object-fit: cover; transition: all 0.3s ease;" src="${iconUrl}"/>`;
    stremioButton.setAttribute('style', 'margin-left: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; border-radius: 50%;');

    const img = stremioButton.querySelector('img');

    stremioButton.addEventListener('mouseenter', () => img.style.transform = 'scale(1.1)');
    stremioButton.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');

    const showFeedback = (isSuccess) => {
      const color = isSuccess ? '#34d399' : '#f87171';
      img.style.boxShadow = `0 0 0 3px ${color}, 0 4px 12px ${color}80`;
      img.style.transform = 'scale(1.1)';
      setTimeout(() => {
        img.style.boxShadow = 'none';
        img.style.transform = 'scale(1)';
      }, 3000);
    };

    stremioButton.addEventListener('click', async (e) => {
      e.preventDefault();

      if (action === 'open') {
        chrome.runtime.sendMessage({ type: 'OPEN_IN_STREMIO_DIRECT', query: title, year, mediaType: type }, (res) => {
          showFeedback(res && res.success);
        });
        return;
      }

      const stored = await chrome.storage.local.get('autoSave');
      const autoSave = stored.autoSave !== false;

      if (autoSave) {
        chrome.runtime.sendMessage({ type: 'ADD_TO_LIBRARY', query: title, year, mediaType: type }, (res) => {
          showFeedback(res && res.success);
        });
      } else {
        chrome.runtime.sendMessage({ type: 'SEARCH_IN_POPUP', query: title, year, mediaType: type });
      }
    });

    actionsElement.appendChild(stremioButton);
  }

  // ==================== Rotten Tomatoes ====================

  function injectRT(action = 'save') {
    if (document.getElementById('stremio-hub-btn')) return;
    const ctaWrap = document.querySelector('.media-scorecard');
    if (!ctaWrap) return;

    const title = document.querySelector('h1, [data-qa="score-panel-title"]')?.textContent?.trim();
    const year = document.querySelector('.scoreboard__info, .info, [data-qa="movie-info-item"]')?.textContent?.match(/\d{4}/)?.[0];
    const type = href.includes('/tv/') ? 'series' : 'movie';

    if (!title) return;

    const btnText = action === 'open' ? 'Open in Stremio' : 'Save to Stremio';
    const iconUrl = chrome.runtime.getURL('icons/stremio-icon.png');
    const stremioButton = document.createElement('button');
    stremioButton.id = 'stremio-hub-btn';
    stremioButton.innerHTML = `<img title="StremioHub" style="float: left;width: 30px;height: 30px;border-radius:6px;object-fit:cover;" src="${iconUrl}"/><span style="font-weight: bold;font-size: 14px;margin-top: 4px;margin-left: 10px;padding: 0;float: left;color: #7b5ea7;">${btnText}</span>`;
    stremioButton.setAttribute('style', 'height:50px;margin-right: 10px;text-align: left;margin-bottom: 10px;background-color: white; border: 1px solid #7b5ea7; border-radius: 30px; padding: 10px 20px; cursor: pointer; display: flex; align-items: center; transition: 0.2s;');

    stremioButton.addEventListener('mouseenter', () => stremioButton.style.backgroundColor = '#f3e8ff');
    stremioButton.addEventListener('mouseleave', () => stremioButton.style.backgroundColor = 'white');

    stremioButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const span = stremioButton.querySelector('span');

      if (action === 'open') {
        span.textContent = 'Opening...';
        chrome.runtime.sendMessage({ type: 'OPEN_IN_STREMIO_DIRECT', query: title, year, mediaType: type }, (res) => {
          if (res && res.success) {
            span.textContent = 'Opened ✓';
          } else {
            span.textContent = 'Failed';
          }
          setTimeout(() => span.textContent = btnText, 3000);
        });
        return;
      }

      const stored = await chrome.storage.local.get('autoSave');
      const autoSave = stored.autoSave !== false;

      if (autoSave) {
        span.textContent = 'Saving...';
        chrome.runtime.sendMessage({ type: 'ADD_TO_LIBRARY', query: title, year, mediaType: type }, (res) => {
          if (res && res.success) {
            span.textContent = 'Saved ✓';
            stremioButton.style.border = '1px solid #34d399';
            span.style.color = '#34d399';
          } else {
            span.textContent = 'Failed';
          }
          setTimeout(() => {
            span.textContent = btnText;
            stremioButton.style.border = '1px solid #7b5ea7';
            span.style.color = '#7b5ea7';
          }, 3000);
        });
      } else {
        span.textContent = 'Loading...';
        chrome.runtime.sendMessage({ type: 'SEARCH_IN_POPUP', query: title, year, mediaType: type });
        setTimeout(() => {
          span.textContent = btnText;
        }, 2000);
      }
    });

    ctaWrap.insertBefore(stremioButton, ctaWrap.firstChild);
  }

  // ==================== Metacritic ====================

  function injectMetacritic(action = 'save') {
    if (document.getElementById('stremio-hub-btn')) return;

    const title = document.querySelector('h1')?.textContent?.trim();
    const year = document.querySelector('.c-productHero_score-container, .release_date, .c-heroMetadata')
      ?.textContent?.match(/\d{4}/)?.[0];
    const type = href.includes('/tv/') ? 'series' : 'movie';

    if (!title) return;

    const whereToWatchContainer = document.querySelector('.where-to-watch__button')?.parentElement;

    if (whereToWatchContainer) {
      const btnText = action === 'open' ? 'Open in Stremio' : 'Save to Stremio';
      const iconUrl = chrome.runtime.getURL('icons/stremio-icon.png');
      const stremioButton = document.createElement('button');
      stremioButton.id = 'stremio-hub-btn';
      stremioButton.type = 'button';
      // Match Metacritic's native button classes
      stremioButton.className = 'font-medium inline-flex items-center no-underline cursor-pointer border-solid ring-0 shadow-none outline-0 rounded-[0.3rem] transition-all duration-[150ms] ease-[ease] h-12 text-base leading-[26px] justify-center px-4 w-full where-to-watch__button';
      stremioButton.style.cssText = 'border: 1px solid rgba(145, 109, 213, 0.4); background-color: rgba(145, 109, 213, 0.1); color: #9c83c2; margin-bottom: 12px;';
      
      stremioButton.innerHTML = `
        <img style='width: 24px; height: 24px; border-radius: 4px; margin-right: 10px; object-fit: cover; box-shadow: 0 2px 6px rgba(0,0,0,0.2);' src="${iconUrl}" />
        <span class="leading-normal whitespace-nowrap overflow-hidden text-ellipsis font-bold">${btnText}</span>
      `;

      stremioButton.addEventListener('mouseenter', () => stremioButton.style.backgroundColor = 'rgba(145, 109, 213, 0.2)');
      stremioButton.addEventListener('mouseleave', () => stremioButton.style.backgroundColor = 'rgba(145, 109, 213, 0.1)');

      const span = stremioButton.querySelector('span');

      stremioButton.addEventListener('click', async (e) => {
        e.preventDefault();

        if (action === 'open') {
          span.textContent = 'Opening...';
          chrome.runtime.sendMessage({ type: 'OPEN_IN_STREMIO_DIRECT', query: title, year, mediaType: type }, (res) => {
            if (res && res.success) {
              span.textContent = 'Opened ✓';
              span.style.color = '#34d399';
            } else {
              span.textContent = 'Failed';
              span.style.color = '#f87171';
            }
            setTimeout(() => {
              span.textContent = btnText;
              span.style.color = 'inherit';
            }, 3000);
          });
          return;
        }

        const stored = await chrome.storage.local.get('autoSave');
        const autoSave = stored.autoSave !== false;

        if (autoSave) {
          span.textContent = 'Saving...';
          chrome.runtime.sendMessage({ type: 'ADD_TO_LIBRARY', query: title, year, mediaType: type }, (res) => {
            if (res && res.success) {
              span.textContent = 'Saved ✓';
              span.style.color = '#34d399';
            } else {
              span.textContent = 'Failed';
              span.style.color = '#f87171';
            }
            setTimeout(() => {
              span.textContent = btnText;
              span.style.color = 'inherit';
            }, 3000);
          });
        } else {
          span.textContent = 'Loading...';
          chrome.runtime.sendMessage({ type: 'SEARCH_IN_POPUP', query: title, year, mediaType: type });
          setTimeout(() => span.textContent = btnText, 2000);
        }
      });

      whereToWatchContainer.insertBefore(stremioButton, whereToWatchContainer.firstChild);
    } else {
      // Fallback
      const target = document.querySelector('.c-productHero, .product-hero, .c-heroSection');
      if (target) insertStremioButton(target, title, year, type, 'append', action);
    }
  }

  // ==================== Standard Button Factory ====================

  function insertStremioButton(targetEl, title, year, type, position, action = 'save') {
    if (!targetEl || !title) return;
    if (document.getElementById('stremio-hub-btn')) return;

    const iconUrl = chrome.runtime.getURL('icons/stremio-icon.png');
    const btnText = action === 'open' ? 'فتح في Stremio' : 'حفظ في Stremio';

    const wrapper = document.createElement('div');
    wrapper.id = 'stremio-hub-btn';
    wrapper.setAttribute('role', 'button');
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('aria-label', `${btnText} - ${title}`);

    wrapper.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(20, 20, 25, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(123, 94, 167, 0.4);
      color: white;
      padding: 8px 16px 8px 10px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      margin: 10px 0;
      transition: all 0.2s ease;
      text-decoration: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(123, 94, 167, 0.2);
      user-select: none;
      position: relative;
      z-index: 1000;
    `;

    wrapper.innerHTML = `
      <img src="${iconUrl}" style="width: 24px; height: 24px; border-radius: 6px; object-fit: cover; box-shadow: 0 2px 6px rgba(0,0,0,0.3);" alt="Stremio">
      <span>${btnText}</span>
    `;

    // Hover effects
    wrapper.addEventListener('mouseenter', () => {
      wrapper.style.transform = 'translateY(-2px)';
      wrapper.style.boxShadow = '0 6px 16px rgba(123, 94, 167, 0.35)';
      wrapper.style.background = 'rgba(25, 25, 30, 0.95)';
    });
    wrapper.addEventListener('mouseleave', () => {
      wrapper.style.transform = '';
      wrapper.style.boxShadow = '0 4px 12px rgba(123, 94, 167, 0.2)';
      wrapper.style.background = 'rgba(20, 20, 25, 0.85)';
    });

    // Click handler
    const handleAction = async () => {
      const span = wrapper.querySelector('span');

      if (action === 'open') {
        span.textContent = 'جارِ الفتح...';
        chrome.runtime.sendMessage({ type: 'OPEN_IN_STREMIO_DIRECT', query: title, year, mediaType: type }, (res) => {
          if (res && res.success) {
            span.textContent = 'تم الفتح ✓';
          } else {
            span.textContent = 'فشل';
          }
          setTimeout(() => span.textContent = btnText, 3000);
        });
        return;
      }

      const stored = await chrome.storage.local.get('autoSave');
      const autoSave = stored.autoSave !== false;

      if (autoSave) {
        span.textContent = 'جارِ الحفظ...';

        chrome.runtime.sendMessage({
          type: 'ADD_TO_LIBRARY',
          query: title,
          year,
          mediaType: type
        }, (res) => {
          if (res && res.success) {
            span.textContent = 'تم الحفظ بنجاح ✓';
            span.style.color = '#34d399';
            wrapper.style.borderColor = '#34d399';
          } else {
            span.textContent = 'فشل الحفظ';
            span.style.color = '#f87171';
          }
          setTimeout(() => {
            span.textContent = btnText;
            span.style.color = 'white';
            wrapper.style.borderColor = 'rgba(123, 94, 167, 0.4)';
          }, 3000);
        });
      } else {
        span.textContent = 'جارِ البحث...';
        chrome.runtime.sendMessage({
          type: 'SEARCH_IN_POPUP',
          query: title,
          year,
          mediaType: type
        });
        setTimeout(() => {
          span.textContent = btnText;
        }, 2000);
      }
    };

    wrapper.addEventListener('click', handleAction);
    wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAction();
      }
    });

    switch (position) {
      case 'prepend': targetEl.prepend(wrapper); break;
      case 'append': targetEl.append(wrapper); break;
      case 'after': targetEl.after(wrapper); break;
    }
  }

  // ==================== Run ====================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Observer for dynamically loaded content (specifically useful for Google Search and SPAs)
  const observer = new MutationObserver(() => {
    if (!document.getElementById('stremio-hub-btn') && !document.getElementById('stremio-google-btn')) {
      init();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(() => observer.disconnect(), 10000);

})();
