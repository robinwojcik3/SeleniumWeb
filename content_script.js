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
