// arcgis_veg.js
(() => {
  const TIMEOUT = 15000;

  function waitForElement(selectorOrFn, timeout = TIMEOUT) {
    return new Promise((resolve, reject) => {
      const end = Date.now() + timeout;
      const lookup = () => {
        const el = typeof selectorOrFn === 'function' ? selectorOrFn() : document.querySelector(selectorOrFn);
        if (el) {
          clearTimeout(timer);
          observer.disconnect();
          resolve(el);
          return true;
        }
        if (Date.now() > end) {
          clearTimeout(timer);
          observer.disconnect();
          reject(new Error(`Timeout waiting for element: ${selectorOrFn}`));
          return true;
        }
        return false;
      };

      if (lookup()) return;

      const observer = new MutationObserver(lookup);
      observer.observe(document.documentElement, { childList: true, subtree: true });
      const timer = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for element: ${selectorOrFn}`));
      }, timeout);
    });
  }

  async function run() {
    const log = msg => console.log(`[arcgis_veg] ${msg}`);
    log('Initialisation');
    try {
      const okBtn = await waitForElement(() => {
        return Array.from(document.querySelectorAll('button, .jimu-btn'))
          .find(el => el.textContent.trim() === 'OK');
      }).catch(() => null);
      if (okBtn) {
        okBtn.click();
        log('Splash screen closed');
      } else {
        log('Splash screen not found');
      }

      const layerBtn = await waitForElement('div[title="Liste des couches"]');
      layerBtn.click();
      log('Layer panel opened');

      const layerRow = await waitForElement(() => {
        const byClass = document.querySelector('.layer-tr-node-Carte_de_la_végétation_9780');
        if (byClass) return byClass;
        return Array.from(document.querySelectorAll('.layer-list, .layerList, .layers, tr, li'))
          .find(el => el.textContent.includes('Carte de la végétation'));
      });
      log('Layer row found');

      const menuBtn = layerRow.querySelector('div[title], .layer-menu, .jimu-icon');
      if (!menuBtn) throw new Error('Menu button not found');
      menuBtn.click();
      log('Layer menu opened');

      const visibilityItem = await waitForElement(() => {
        return Array.from(document.querySelectorAll('div, li, .menu-item')).find(el => el.textContent.includes('Définir la plage de visibilité'));
      });
      visibilityItem.click();
      log('Visibility option selected');

      const rangeInput = await waitForElement('input.dijitInputInner');
      rangeInput.focus();
      rangeInput.select();
      document.execCommand('insertText', false, '1:100');
      rangeInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
      log('Visibility range set');

      // reopen menu if closed
      if (!document.querySelector('.dijitTooltipContainer')) {
        menuBtn.click();
      }
      const transparencyItem = await waitForElement(() => {
        return Array.from(document.querySelectorAll('div, li, .menu-item')).find(el => el.textContent.includes('Transparence'));
      });
      transparencyItem.click();
      log('Transparency option selected');

      const sliderBar = await waitForElement('.dijitSliderBarContainerH');
      const rect = sliderBar.getBoundingClientRect();
      sliderBar.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      }));
      log('Transparency set to 50%');

      const closeBtn = await waitForElement('.close-btn.jimu-float-trailing');
      closeBtn.click();
      log('Layer panel closed');
    } catch (err) {
      console.error('[arcgis_veg] Error:', err);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    run();
  } else {
    window.addEventListener('DOMContentLoaded', run);
  }
})();
