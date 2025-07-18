// content_script.js
// Listen for messages coming from the page itself.
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) {
    return;
  }
  const data = event.data;
  if (data && data.type === 'coords' && data.payload) {
    // Forward the coordinates to the background service worker
    chrome.runtime.sendMessage({
      type: 'coords',
      payload: data.payload
    });
  }
});
