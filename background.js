// background.js - Chrome Extension Service Worker (MV3)
// Listen for coordinate messages and open the ArcGIS viewer around them.

// Keep the timestamp of the last processed message to debounce events.
let lastProcessed = 0;

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

// Handle messages sent from content scripts or other parts of the extension.
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'coords' || !message.payload) {
    return;
  }

  const { lat, lon } = message.payload;
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return; // Ignore malformed messages
  }

  const now = Date.now();
  if (now - lastProcessed < 1000) {
    return; // Ignore events fired less than 1s apart
  }
  lastProcessed = now;

  const { x, y } = latLonToWebMercator(lat, lon);
  const buf = 1000;
  const url =
    `https://www.arcgis.com/apps/webappviewer/index.html` +
    `?id=bece6e542e4c42e0ba9374529c7de44c` +
    `&extent=${x - buf},${y - buf},${x + buf},${y + buf},102100`;

  chrome.tabs.create({ url });
});
