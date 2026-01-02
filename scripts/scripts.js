import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
} from './aem.js';

import {
  initMartech,
  martechEager,
  martechLazy,
  martechDelayed,
} from '../plugins/martech/src/index.js';

/* ──────────────────────────────────────────────────────────────────────────
   Hero & Auto Blocks
───────────────────────────────────────────────────────────────────────── */

function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');

  if (!h1 || !picture) return;

  const prec = Node.DOCUMENT_POSITION_PRECEDING;
  // eslint-disable-next-line no-bitwise
  const isPictureBeforeHeading = (h1.compareDocumentPosition(picture) & prec) > 0;

  if (isPictureBeforeHeading) {
    if (h1.closest('.hero') || picture.closest('.hero')) return;
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) {
      sessionStorage.setItem('fonts-loaded', 'true');
    }
  } catch (e) {
    // silent fail
  }
}

/**
 * Dependency cycle fix: In AEM, auto-blocking fragments should 
 * usually be handled via buildBlock rather than direct imports 
 * to avoid importing block logic back into scripts.js.
 */
function buildAutoBlocks(main) {
  try {
    const fragments = main.querySelectorAll('a[href*="/fragments/"]');
    fragments.forEach((a) => {
      const path = new URL(a.href).pathname;
      if (path.startsWith('/fragments/')) {
        const block = buildBlock('fragment', { elems: [a.cloneNode(true)] });
        a.replaceWith(block);
      }
    });

    buildHeroBlock(main);

    if (!main.querySelector('.lyca-snow')) {
      const section = document.createElement('div');
      const snow = document.createElement('div');
      snow.className = 'lyca-snow';
      section.append(snow);
      main.append(section);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed:', error);
  }
}

export function decorateMain(main) {
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/* ──────────────────────────────────────────────────────────────────────────
   Checkout Logic
───────────────────────────────────────────────────────────────────────── */

const CHECKOUT_SELECTION_KEY = 'lyca.checkout.selectedPlan';

function normalizePrice(price, fallback) {
  return (price || '')
    .replace(/¶œ\s*/gi, '£')
    .replace(/\s+/g, ' ')
    .trim() || fallback;
}

/**
 * Exported to resolve no-unused-vars. 
 * This allows checkout blocks to import this logic.
 */
export function getCheckoutSelection() {
  const defaults = {
    title: '24 month Unlimited',
    oldPrice: '£18.00',
    newPrice: '£9.00',
    subText: 'for the first 6 months, then £18',
    features: [
      '30GB EU roaming included',
      '100 International minutes',
      'Unlimited UK mins and text',
      'Unlimited EU mins and text when roaming in EU (fair use policy applies)',
    ],
  };

  try {
    const stored = sessionStorage.getItem(CHECKOUT_SELECTION_KEY);
    if (!stored) return defaults;

    const parsed = JSON.parse(stored);
    return {
      title: parsed.title || defaults.title,
      oldPrice: normalizePrice(parsed.oldPrice, defaults.oldPrice),
      newPrice: normalizePrice(parsed.newPrice, defaults.newPrice),
      subText: normalizePrice(parsed.subText, defaults.subText),
      features: Array.isArray(parsed.features) && parsed.features.length
        ? parsed.features
        : defaults.features,
    };
  } catch {
    return defaults;
  }
}

export function decorateCheckoutLayout(main) {
  if (!document.body.classList.contains('paymonthly-checkout')) return;

  document.body.classList.add('checkout-hide-chrome');

  if (main.dataset.checkoutDecorated === 'true') return;
  main.dataset.checkoutDecorated = 'true';
}

/* ──────────────────────────────────────────────────────────────────────────
   Alloy / Adobe Analytics Tracking
───────────────────────────────────────────────────────────────────────── */

function createEventPayload(base) {
  return {
    xdm: {
      eventType: 'web.webpagedetails.pageViews',
      web: {
        webPageDetails: {
          URL: window.location.href,
          ...base.web.webPageDetails,
        },
      },
      _acsapac: {
        Currency: base.currency,
        channel: '',
        country: base.country,
        eventType: base.eventName,
        monthlyPriceLocal: '',
        monthlyPriceUSD: '',
        planName: '',
        language: base.language,
      },
    },
  };
}

function sendLandingPageEvent(language) {
  const currency = language === 'FR' ? 'Euro' : 'Pound';
  const country = language === 'FR' ? 'FR' : 'GB';

  window.alloy('sendEvent', createEventPayload({
    currency,
    country,
    language,
    eventName: 'Home Page View Event',
    web: { webPageDetails: { name: 'Home Page', siteSection: 'Home' } },
  }));
}

function sendPLPEvent(language) {
  const currency = language === 'FR' ? 'Euro' : 'Pound';
  const country = language === 'FR' ? 'FR' : 'GB';

  window.alloy('sendEvent', createEventPayload({
    currency,
    country,
    language,
    eventName: 'Plan Viewed Event',
    web: { webPageDetails: { name: 'Listing Page', siteSection: 'Listing' } },
  }));
}

function sendCheckoutEvent(language) {
  const currency = language === 'FR' ? 'Euro' : 'Pound';
  const country = language === 'FR' ? 'FR' : 'GB';

  window.alloy('sendEvent', createEventPayload({
    currency,
    country,
    language,
    eventName: 'Checkout Page Event',
    web: { webPageDetails: { name: 'Checkout Page', siteSection: 'Checkout' } },
  }));
}

function waitForRealAlloy(maxAttempts = 40, interval = 250) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts += 1;
      if (window.alloy && typeof window.alloy !== 'function') {
        resolve();
        return;
      }
      if (attempts >= maxAttempts) {
        reject(new Error('Alloy timeout'));
        return;
      }
      setTimeout(check, interval);
    };
    check();
  });
}

async function initAlloyTracking() {
  const template = (getMetadata('template') || '').trim().toLowerCase();
  const language = (getMetadata('language') || 'EN').toUpperCase();

  if (!template) return;

  try {
    await waitForRealAlloy();
    switch (template) {
      case 'landing':
      case 'home':
        sendLandingPageEvent(language);
        break;
      case 'plp':
      case 'plans':
      case 'listing':
        sendPLPEvent(language);
        break;
      case 'checkout':
      case 'paymonthly-checkout':
        sendCheckoutEvent(language);
        break;
      default:
        break;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to send tracking event:', e);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Page Loading Lifecycle
───────────────────────────────────────────────────────────────────────── */

async function loadEager(doc) {
  document.documentElement.lang = 'en';
  const { pathname } = window.location;
  const template = getMetadata('template');
  if (template) document.body.classList.add(`paymonthly-${template}`);

  const checkPath = '/paymonthly/en/checkout/checkout';
  const isCheckout = template === 'checkout' || pathname.includes(checkPath);
  if (isCheckout) {
    document.body.classList.add('paymonthly-checkout');
    if (pathname.includes(checkPath)) {
      document.body.classList.add('checkout-hide-chrome');
    }
  }

  decorateTemplateAndTheme();

  const martechLoadedPromise = initMartech(
    {
      datastreamId: 'c3040c2e-07d6-446c-8f3c-d3f500ff3113',
      orgId: '09CF60665F98CEF90A495FF8@AdobeOrg',
      defaultConsent: 'in',
      onBeforeEventSend: () => { /* optional */ },
      edgeConfigOverrides: {},
    },
    {
      personalization: !!getMetadata('target'),
      launchUrls: [
        'https://assets.adobedtm.com/0e9a0418089e/4efb62083c74/launch-7537c509f5f7-development.min.js',
      ],
    },
  );

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    decorateCheckoutLayout(main);
    document.body.classList.add('appear');
    const section = main.querySelector('.section, .checkout-hero');
    if (section) {
      await Promise.all([
        martechLoadedPromise.then(martechEager),
        loadSection(section, waitForFirstImage),
      ]);
    }
    initAlloyTracking();
  }

  if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
    loadFonts().catch(() => {});
  }
}

async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);
  const { hash } = window.location;
  if (hash) {
    const element = doc.getElementById(hash.substring(1));
    if (element) element.scrollIntoView();
  }
  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));
  await martechLazy();
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  await loadFonts();
}

function loadDelayed() {
  window.setTimeout(() => {
    martechDelayed();
    import('./delayed.js').catch(() => {});
  }, 3000);
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
