// background.js
// Affiche dans la console les coordonnees recues du content script

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'coords' && message.payload) {
    console.log('Coordonnees recues:', message.payload.lat, message.payload.lon);
  }
});
