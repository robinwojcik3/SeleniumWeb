(async () => {
  const waitForElement = (selector, timeout = 15000) => {
    return new Promise((resolve, reject) => {
      const isFn = typeof selector === 'function';
      const check = () => {
        const el = isFn ? selector() : document.querySelector(selector);
        if (el) {
          clearTimeout(timer);
          observer.disconnect();
          resolve(el);
        }
      };
      const observer = new MutationObserver(check);
      observer.observe(document.documentElement, { childList: true, subtree: true });
      const timer = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for element: ${isFn ? 'function' : selector}`));
      }, timeout);
      check();
    });
  };

  console.log('ArcGIS vegetation script start');

  try {
    console.log('Waiting for splash screen OK button');
    const okButton = await waitForElement(() => Array.from(document.querySelectorAll('button, div.jimu-btn')).find(el => el.textContent.trim() === 'OK'));
    okButton.click();
    console.log('Splash screen dismissed');

    console.log('Opening layer list');
    const layerListBtn = await waitForElement('div[title="Liste des couches"]');
    layerListBtn.click();

    console.log('Waiting for vegetation layer row');
    const vegRow = await waitForElement(() =>
      document.querySelector('.layer-tr-node-Carte_de_la_végétation_9780') ||
      Array.from(document.querySelectorAll('.layer-row, .layer-tr-node')).find(el => /Carte de la végétation/i.test(el.textContent))
    );
    console.log('Vegetation layer row found');

    console.log('Opening layer menu');
    const menuButton = vegRow.querySelector('button, .jimu-icon-more, [role="button"]');
    if (!menuButton) throw new Error('Menu button not found');
    menuButton.click();

    console.log('Selecting visibility menu item');
    const visibilityItem = await waitForElement(() => Array.from(document.querySelectorAll('div, li')).find(el => /Définir la plage de visibilité/i.test(el.textContent)));
    visibilityItem.click();

    console.log('Setting visibility range to 1:100');
    const rangeInput = await waitForElement('input.dijitInputInner');
    rangeInput.focus();
    rangeInput.select();
    rangeInput.value = '1:100';
    rangeInput.dispatchEvent(new Event('input', { bubbles: true }));
    rangeInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    rangeInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));

    console.log('Opening layer menu again');
    menuButton.click();

    console.log('Selecting transparency item');
    const transparencyItem = await waitForElement(() => Array.from(document.querySelectorAll('div, li')).find(el => /Transparence/i.test(el.textContent)));
    transparencyItem.click();

    console.log('Setting transparency to 50%');
    const sliderContainer = await waitForElement('.dijitSliderBarContainerH');
    const rect = sliderContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    sliderContainer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: centerX, clientY: centerY }));
    sliderContainer.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: centerX, clientY: centerY }));

    console.log('Closing layer list panel');
    const closeBtn = await waitForElement('.close-btn.jimu-float-trailing');
    closeBtn.click();

    console.log('ArcGIS vegetation configuration complete');
  } catch (err) {
    console.error('ArcGIS vegetation script error:', err);
  }
})();
