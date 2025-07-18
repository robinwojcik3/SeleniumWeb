// Listen for messages posted from the webpage
window.addEventListener('message', (event) => {
  // Only accept messages from the same page
  if (event.source !== window) {
    return;
  }

  const data = event.data;
  if (data && data.type === 'coords') {
    // Forward the coordinates to the background script
    chrome.runtime.sendMessage(data);
  }
});
