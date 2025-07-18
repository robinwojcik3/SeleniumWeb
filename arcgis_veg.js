(async () => {
  const log = (msg) => console.log(`[ArcGIS Veg] ${msg}`);

  function waitForElement(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearTimeout(timer);
          observer.disconnect();
          resolve(el);
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      const timer = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout while waiting for selector: ${selector}`));
      }, timeout);
    });
  }

  function waitForElementByText(selector, text, timeout = 15000) {
    const search = () => {
      const els = document.querySelectorAll(selector);
      return Array.from(els).find(el => el.textContent.trim().toLowerCase() === text.toLowerCase());
    };
    return new Promise((resolve, reject) => {
      const el = search();
      if (el) return resolve(el);
      const observer = new MutationObserver(() => {
        const el = search();
        if (el) {
          clearTimeout(timer);
          observer.disconnect();
          resolve(el);
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      const timer = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout while waiting for ${text}`));
      }, timeout);
    });
  }

  function waitForLayerRow(name, timeout = 15000) {
    const search = () => {
      const byClass = document.querySelector('.layer-tr-node-Carte_de_la_v\u00e9g\u00e9tation_9780');
      if (byClass) return byClass;
      const rows = document.querySelectorAll('tr');
      for (const row of rows) {
        if (row.textContent.includes(name)) return row;
      }
      return null;
    };
    return new Promise((resolve, reject) => {
      const el = search();
      if (el) return resolve(el);
      const observer = new MutationObserver(() => {
        const el = search();
        if (el) {
          clearTimeout(timer);
          observer.disconnect();
          resolve(el);
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      const timer = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout while waiting for layer row ${name}`));
      }, timeout);
    });
  }

  const clickCenter = (element) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    ['mousedown', 'mouseup', 'click'].forEach(type => {
      element.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }));
    });
  };

  try {
    log('Waiting for splash screen ...');
    const okBtn = await waitForElementByText('button, .jimu-btn', 'OK');
    log('Closing splash screen');
    okBtn.click();

    log('Opening layers list');
    const listBtn = await waitForElement('div[title="Liste des couches"]');
    listBtn.click();

    log('Searching for vegetation layer');
    const row = await waitForLayerRow('Carte de la v\u00e9g\u00e9tation');

    log('Opening layer menu');
    const menuBtn = row.querySelector('button, div[role="button"]');
    if (!menuBtn) throw new Error('Menu button not found for layer');
    menuBtn.click();

    log('Setting visibility range');
    const visOption = await waitForElementByText('*', 'D\u00e9finir la plage de visibilit\u00e9');
    visOption.click();
    const input = await waitForElement('.dijitInputInner');
    input.focus();
    input.select();
    document.execCommand('delete');
    input.value = '1:100';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    log('Setting transparency');
    const transOption = await waitForElementByText('*', 'Transparence');
    transOption.click();
    const slider = await waitForElement('.dijitSliderBarContainerH');
    clickCenter(slider);

    log('Closing layers panel');
    const closeBtn = await waitForElement('.close-btn.jimu-float-trailing');
    closeBtn.click();
    log('Done');
  } catch (err) {
    console.error('[ArcGIS Veg] Error:', err);
  }
})();
