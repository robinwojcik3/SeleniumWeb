// Background service worker: logs received coordinates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'coords' && message.payload) {
    const { lat, lon } = message.payload;
    console.log('Coordinates received:', lat, lon);
  }
});

