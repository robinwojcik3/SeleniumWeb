// content_script.js
// Ecoute les messages de la page et transfere les coordonnees au background

// Only accept messages from the same window
window.addEventListener('message', (event) => {
  if (event.source !== window) return; // ignore cross-origin or iframes

  const data = event.data;
  if (data && data.type === 'coords') {
    // Transfert des coordonnees au background
    chrome.runtime.sendMessage({
      type: 'coords',
      payload: data.payload
    });
  }
});
