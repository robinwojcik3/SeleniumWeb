// background.js - Chrome Extension Service Worker (MV3)
// Listen for coordinate messages and open the Geoportail soil map around them.

// Keep the timestamp of the last processed message to debounce events (<1s)
let lastProcessed = 0;

// Id of the Geoportail tab reused between analyses
let soilMapTabId = null;
let lastVegOptions = { scaleMin: '1:100', transparency: 0.5 };
// Id of the tab that sent the last coordinates message (Netlify page)
let senderTabId = null;

// Send a veg:init message when the Geoportail tab finishes loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId === soilMapTabId && changeInfo.status === 'complete') {
    chrome.tabs.sendMessage(tabId, { type: 'veg:init', options: lastVegOptions });
  }
});

/**
 * Build the Geoportail soil map URL centered on the provided coordinates.
 * @param {number} lat
 * @param {number} lon
 * @returns {string}
 */
function buildUrl(lat, lon) {
  const latStr = lat.toFixed(6);
  const lonStr = lon.toFixed(6);
  return (
    'https://www.geoportail.gouv.fr/carte' +
    `?c=${lonStr},${latStr}` +
    '&z=12' +
    '&l0=ORTHOIMAGERY.ORTHOPHOTOS::GEOPORTAIL:OGC:WMTS(1)' +
    '&l1=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR.CV::GEOPORTAIL:OGC:WMTS(1)' +
    '&l2=INRA.CARTE.SOLS::GEOPORTAIL:OGC:WMTS(0.8)' +
    '&permalink=yes'
  );
}

// Handle messages sent from content scripts or other parts of the extension.
chrome.runtime.onMessage.addListener((message, sender) => {
  // Handle coordinate messages sent from the Netlify page
  if (message?.type === 'coords' && message.payload) {
    // Remember the tab that triggered the analysis
    senderTabId = sender?.tab?.id ?? null;

    const { lat, lon } = message.payload;
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return; // Ignore malformed messages
    }

    lastVegOptions = message.options || lastVegOptions;
    console.info('[bg] options', lastVegOptions);

    const now = Date.now();
    if (now - lastProcessed < 1000) {
      return; // Ignore events fired less than 1s apart
    }
    lastProcessed = now;

    const url = buildUrl(lat, lon);

    if (soilMapTabId !== null) {
      chrome.tabs.get(soilMapTabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          chrome.tabs.create({ url }).then((newTab) => {
            soilMapTabId = newTab.id;
            chrome.tabs.sendMessage(newTab.id, {
              type: 'veg:update',
              options: lastVegOptions
            });
          });
        } else {
          chrome.tabs.update(soilMapTabId, { url, active: true }).then(() => {
            chrome.tabs.sendMessage(soilMapTabId, {
              type: 'veg:update',
              options: lastVegOptions
            });
          });
        }
      });
    } else {
      chrome.tabs.create({ url }).then((newTab) => {
        soilMapTabId = newTab.id;
        chrome.tabs.sendMessage(newTab.id, {
          type: 'veg:update',
          options: lastVegOptions
        });
      });
    }
    return;
  }

  // Forward vegetation status messages to the originating Netlify tab
  if (message?.type === 'veg:ready' || message?.type === 'veg:error') {
    const status = message.type === 'veg:ready' ? 'ready' : 'error';
    if (senderTabId != null) {
      // Relay the vegetation processing status back to the Netlify page
      chrome.tabs.sendMessage(senderTabId, {
        type: 'veg:status',
        status,
        error: message.error
      });
    }
  }
});

// Reset the stored tab id when the tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === soilMapTabId) {
    soilMapTabId = null;
  }
});

