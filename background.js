// background.js - Chrome Extension Service Worker (MV3)
// Listen for coordinate messages and open the ArcGIS viewer around them.

// Keep the timestamp of the last processed message to debounce events (<1s)
let lastProcessed = 0;

// Id of the ArcGIS tab reused between analyses
let arcgisTabId = null;
let lastVegOptions = { scaleMin: '1:100', transparency: 0.5 };
// Id of the tab that sent the last coordinates message (Netlify page)
let senderTabId = null;

// Send a veg:init message when the ArcGIS tab finishes loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId === arcgisTabId && changeInfo.status === 'complete') {
    chrome.tabs.sendMessage(tabId, { type: 'veg:init', options: lastVegOptions });
  }
});

/**
 * Convert WGS84 latitude/longitude to Web Mercator coordinates.
 * @param {number} lat Latitude in decimal degrees
 * @param {number} lon Longitude in decimal degrees
 * @returns {{x:number, y:number}} Coordinates in meters
 */
function latLonToWebMercator(lat, lon) {
  const R = 6_378_137; // Earth radius in meters
  const rad = Math.PI / 180;
  const x = R * lon * rad;
  const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * rad) / 2));
  return { x, y };
}

/**
 * Build the ArcGIS viewer URL centered on the provided coordinates.
 * @param {number} lat
 * @param {number} lon
 * @returns {string}
 */
function buildUrl(lat, lon) {
  const { x, y } = latLonToWebMercator(lat, lon);
  const buf = 1000; // 1 km buffer around the point
  return (
    'https://www.arcgis.com/apps/webappviewer/index.html' +
    '?id=bece6e542e4c42e0ba9374529c7de44c' +
    `&extent=${x - buf},${y - buf},${x + buf},${y + buf},102100`
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

    if (arcgisTabId !== null) {
      chrome.tabs.get(arcgisTabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          chrome.tabs.create({ url }).then((newTab) => {
            arcgisTabId = newTab.id;
            chrome.tabs.sendMessage(newTab.id, {
              type: 'veg:update',
              options: lastVegOptions
            });
          });
        } else {
          chrome.tabs.update(arcgisTabId, { url, active: true }).then(() => {
            chrome.tabs.sendMessage(arcgisTabId, {
              type: 'veg:update',
              options: lastVegOptions
            });
          });
        }
      });
    } else {
      chrome.tabs.create({ url }).then((newTab) => {
        arcgisTabId = newTab.id;
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
  if (tabId === arcgisTabId) {
    arcgisTabId = null;
  }
});

