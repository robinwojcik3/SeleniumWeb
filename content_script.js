// content_script.js
// Listen for messages coming from the page itself.
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) {
    return;
  }
  const data = event.data;
  if (data && data.type === 'coords' && data.payload) {
    const { lat, lon } = data.payload;
    chrome.runtime.sendMessage({
      type: 'coords',
      payload: { lat, lon },
      options: data.options
    });
  }
});

// Listen for vegetation status updates coming from the background script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'veg:status') {
    // Forward the status to the page so the DOM can react
    window.postMessage({
      type: 'veg:status',
      status: msg.status,
      error: msg.error
    }, '*');
  }
});
