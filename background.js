// background.js - Service worker for MV3 extension
// Listens for coordinate messages, converts them to WebMercator and opens an ArcGIS tab.

let lastProcessed = 0; // Timestamp of the last processed message

/**
 * Convert WGS84 latitude/longitude to WebMercator coordinates.
 * @param {number} lat Latitude in degrees.
 * @param {number} lon Longitude in degrees.
 * @returns {{x: number, y: number}}
 */
function latLonToWebMercator(lat, lon) {
  const R = 6378137; // Earth radius in meters
  const x = R * (lon * Math.PI / 180);
  const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  return { x, y };
}

// Handle messages from the content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== 'coords' || !message.payload) return;

  const now = Date.now();
  // Ignore messages received within 1s of the previous one
  if (now - lastProcessed < 1000) return;
  lastProcessed = now;

  const { lat, lon } = message.payload;
  const { x, y } = latLonToWebMercator(Number(lat), Number(lon));
  const buf = 1000;
  const url =
    `https://www.arcgis.com/apps/webappviewer/index.html?id=bece6e542e4c42e0ba9374529c7de44c&extent=` +
    `${x - buf},${y - buf},${x + buf},${y + buf},102100`;

  chrome.tabs.create({ url });
});
