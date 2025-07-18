// arcgis_veg.js - ES module to configure the vegetation layer on ArcGIS
const TIMEOUT = 15000;

export function waitForElement(selectorOrFn, root = document, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const end = Date.now() + timeout;
    const check = () => {
      const el = typeof selectorOrFn === 'function' ? selectorOrFn() : root.querySelector(selectorOrFn);
      if (el) {
        cleanup();
        resolve(el);
        return true;
      }
      if (Date.now() > end) {
        cleanup();
        reject(new Error(`Timeout waiting for element: ${selectorOrFn}`));
        return true;
      }
      return false;
    };

    const cleanup = () => {
      observer.disconnect();
      clearTimeout(timer);
    };

    if (check()) return;

    const observer = new MutationObserver(check);
    const target = root instanceof Document ? root.documentElement : root;
    observer.observe(target, { childList: true, subtree: true });

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout waiting for element: ${selectorOrFn}`));
    }, timeout);
  });
}

async function configureVegetationLayer({ scaleMin = '1:100', transparency = 0.5 } = {}) {
  console.time('[veg] total');
  const log = (msg) => console.log(`[veg] ${msg}`);
  const scale = String(scaleMin).replace(/[\s\u00A0]/g, '');
  try {
    const okBtn = await waitForElement(() => Array.from(document.querySelectorAll('button, .jimu-btn')).find(b => b.textContent.trim() === 'OK')).catch(() => null);
    if (okBtn) {
      okBtn.click();
      log('Splash screen closed');
    } else {
      log('Splash screen not found');
    }

    const layersBtn = await waitForElement(() => document.querySelector('div[title="Liste des couches"], div[title="Layer List"]'));
    layersBtn.click();
    log('Layer list opened');

    const layerRow = await waitForElement(() => {
      const byClass = document.querySelector('.layer-tr-node-Carte_de_la_végétation_9780');
      if (byClass) return byClass;
      return Array.from(document.querySelectorAll('tr, li, .layerList, .layer-list')).find(el => /Carte de la végétation|Vegetation/i.test(el.textContent));
    });
    log('Layer row found');

    const menuBtn = layerRow.querySelector('div[title], .layer-menu, .jimu-icon');
    if (!menuBtn) throw new Error('Menu button not found');
    menuBtn.click();
    log('Layer menu opened');

    const visibilityItem = await waitForElement(() => Array.from(document.querySelectorAll('div, li, .menu-item')).find(el => /plage de visibilité|visibility range/i.test(el.textContent)));
    visibilityItem.click();
    log('Visibility option selected');

    const rangeInput = await waitForElement('input.dijitInputInner');
    rangeInput.focus();
    rangeInput.select();
    rangeInput.value = scale;
    rangeInput.dispatchEvent(new Event('input', { bubbles: true }));
    rangeInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    log(`Visibility range set to ${scale}`);

    if (!document.querySelector('.dijitTooltipContainer')) {
      menuBtn.click();
    }
    const transItem = await waitForElement(() => Array.from(document.querySelectorAll('div, li, .menu-item')).find(el => /Transparence|Transparency/i.test(el.textContent)));
    transItem.click();
    log('Transparency option selected');

    const sliderBar = await waitForElement('.dijitSliderBarContainerH');
    const rect = sliderBar.getBoundingClientRect();
    sliderBar.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      clientX: rect.left + rect.width * transparency,
      clientY: rect.top + rect.height / 2
    }));
    log(`Transparency set to ${transparency}`);

    const closeBtn = await waitForElement('.close-btn.jimu-float-trailing');
    closeBtn.click();
    log('Layer list closed');
    console.timeEnd('[veg] total');
    chrome.runtime.sendMessage({ type: 'veg:ready' });
  } catch (err) {
    console.error('[veg] error:', err);
    chrome.runtime.sendMessage({ type: 'veg:error', error: err.message });
    throw err;
  }
}

export async function initVegLayer(options) {
  await configureVegetationLayer(options);
}

chrome.runtime.onMessage.addListener((request) => {
  if (request?.type === 'veg:init' || request?.type === 'veg:update') {
    initVegLayer(request.options);
  }
});
