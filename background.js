// background.js
// Receive messages from the content script and log coordinates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'coords' && message.payload) {
    console.log('Coordinates received:', message.payload.lat, message.payload.lon);
  }
});
