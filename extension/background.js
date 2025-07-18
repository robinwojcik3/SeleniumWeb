// Background service worker for the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'coords' && message.payload) {
    console.log('Received coordinates:', message.payload.lat, message.payload.lon);
  }
});
