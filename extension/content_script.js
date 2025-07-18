// Content script: listens for messages from the page and forwards them
// to the background script
window.addEventListener('message', (event) => {
  // Only accept messages from the same page
  if (event.source !== window) return;

  const data = event.data;
  if (data && data.type === 'coords' && data.payload) {
    chrome.runtime.sendMessage({ type: 'coords', payload: data.payload });
  }
});

