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
  // eslint-disable-next-line import/no-relative-packages
} from '../plugins/martech/src/index.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  /* eslint-disable no-bitwise */
  const isPictureBeforeHeading = h1
    && picture
    && (h1.compareDocumentPosition(picture)
      & Node.DOCUMENT_POSITION_PRECEDING) > 0;
  /* eslint-enable no-bitwise */

  if (isPictureBeforeHeading) {
    // Check if h1 or picture is already inside a hero block
    if (h1.closest('.hero') || picture.closest('.hero')) {
      return; // Don't create a duplicate hero block
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) {
      sessionStorage.setItem('fonts-loaded', 'true');
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto block `*/fragments/*` references
    const fragments = main.querySelectorAll('a[href*="/fragments/"]');
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(frag.firstElementChild);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    buildHeroBlock(main);
    const isCheckout = document.body.classList;
    if (!isCheckout && !main.querySelector('.lyca-snow')) {
      const section = document.createElement('div');
      const snow = document.createElement('div');
      snow.className = 'lyca-snow';
      section.append(snow);
      main.append(section);
    }
    // auto block lyca-snow
    if (!main.querySelector('.lyca-snow')) {
      const section = document.createElement('div');
      const snow = document.createElement('div');
      snow.className = 'lyca-snow';
      section.append(snow);
      main.append(section);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

const CHECKOUT_SELECTION_KEY = 'lyca.checkout.selectedPlan';

function normalizePrice(price, fallback) {
  const clean = (price || '')
    .replace(/¶œ\s*/gi, '£')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean && fallback) return fallback;
  return clean;
}

function getCheckoutSelection() {
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
    const parsed = JSON.parse(stored || '{}');
    const features = Array.isArray(parsed.features) && parsed.features.length
      ? parsed.features
      : defaults.features;
    const title = parsed.title || defaults.title;
    return {
      title,
      oldPrice: normalizePrice(parsed.oldPrice, defaults.oldPrice),
      newPrice: normalizePrice(parsed.newPrice, defaults.newPrice),
      subText: normalizePrice(parsed.subText, defaults.subText),
      features,
    };
  } catch (e) {
    return defaults;
  }
}

function getCheckoutStepsFromDoc() {
  const raw = getMetadata('checkout-steps')
    || 'Basket | Credit check | Delivery and payment';
  const steps = raw
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
  const active = parseInt(getMetadata('checkout-step-active') || '1', 10);
  return { steps, active: Number.isNaN(active) ? 1 : active };
}

function buildCheckoutSteps() {
  const { steps, active } = getCheckoutStepsFromDoc();

  const el = document.createElement('div');
  el.className = 'checkout-steps';

  const row = document.createElement('div');
  row.className = 'steps-row';

  steps.forEach((label, idx) => {
    const step = document.createElement('div');
    step.className = 'step';

    const stepIndex = idx + 1;
    if (stepIndex === active) step.classList.add('active');
    else if (stepIndex === active + 1) step.classList.add('next');

    step.textContent = label;
    row.append(step);
  });

  el.append(row);

  const bar = document.createElement('div');
  bar.className = 'step-progress';
  const span = document.createElement('span');

  // Dynamic width calculation
  const total = steps.length || 1;
  const percentage = (active / total) * 100;
  span.style.width = `${percentage}%`;

  bar.append(span);
  el.append(bar);

  return el;
}

function extractCheckoutLogo(main) {
  const sectionLogo = main.querySelector('.section.logo, .logo')
    || main.querySelector('[class*="logo"]');
  const picture = sectionLogo?.querySelector('picture') || sectionLogo?.querySelector('img');
  const fallback = main.querySelector('img[alt*="logo" i]') || main.querySelector('picture');

  const target = picture || fallback;
  const node = target?.cloneNode(true);
  const link = target?.closest('a');
  const href = link ? link.href : '/';

  if (sectionLogo && sectionLogo.parentElement) {
    sectionLogo.remove();
  }

  return { node, href };
}

function parseCheckoutConfig(main) {
  const defaults = {
    titles: ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr'],
    emailVerifyLabel: 'Verify',
    numberOptions: ['I have a number to transfer', 'No, I want a new number'],
    providers: ['Lyca Mobile', 'Other service provider'],
    simTypes: ['eSIM (selected)', 'SIM card'],
    links: [
      "What's eSIM/Check compatibility",
      'View other formats',
      'Terms and conditions',
      'FAQ',
    ],
    primaryCta: 'Checkout now',

    // New Authorable Keys
    sectionTitleDetails: 'Your Details',
    firstNamePlaceholder: 'Enter first name',
    lastNamePlaceholder: 'Enter last name',
    emailPlaceholder: 'Enter your e-mail address',
    emailHelper: 'We need this to send you the order confirmation and dispatch updates.',

    sectionTitleTransfer: 'Do you have a number to bring?',

    sectionTitleSim: 'SIM type',
    sectionSubheadingSim: 'Choose your preferred type of SIM',
    // eslint-disable-next-line max-len
    simInfoEsim: 'Your Lyca Mobile SIM must be activated in the UK, once your SIM is activated in the UK, you can use it internationally according to your mobile plan.',
    simInfoSim: 'A SIM card will be sent to your delivery address.',

    sectionTitleReview: 'Review contract details',
    sectionSubheadingReview: 'We have also sent these to',
    downloadContractInfo: 'Download contract information',
    downloadContractSummary: 'Download contract summary',

    sectionTitleAgreement: 'Contract agreement',
    agreementToggleText: "Please confirm that you're happy with the contract summary and information before you proceed. View full",

    // Order Summary Defaults
    summaryTitle: 'Order summary',
    summaryCostLabel: 'Monthly cost',
    summarySecureCheckout: 'Secure checkout',
    summaryActivateEsim: 'How to activate eSIM?',
    summaryHelp: 'Need help? Find our FAQ related to order checkout',
    // Fallback values if table is missing
    summaryCostValues: ['£18.00', '£9.00', 'for the first 6 months, then £18'],
    summaryPlanName: '24 month Unlimited',
    summaryPlanFeatures: [
      '30GB EU roaming included',
      '100 International minutes',
      'Unlimited UK mins and text',
      'Unlimited EU mins and text when roaming in EU (fair use policy applies)',
    ],
    summaryNotes: [
      'Spend cap is set to £0.00.',
      'You can change this later on Lyca mobile app',
      'Please note the cost of other services you take from us may increase or decrease while you are a Lyca customer.',
    ],
  };

  const getRows = (blockName, tableName) => {
    let rows = [];
    // Check for AEM Block structure (divs)
    const block = main.querySelector(`.${blockName}`);
    if (block) {
      rows = [...block.children].map((row) => {
        const cells = [...row.children];
        return {
          label: cells[0]?.textContent?.trim() || '',
          value: cells[1]?.textContent?.trim() || '',
        };
      });
    } else {
      // Fallback to raw Table structure
      const table = [...main.querySelectorAll('table')].find((tbl) => tbl.innerText.toLowerCase().includes(tableName));
      if (table) {
        rows = [...table.querySelectorAll('tr')].map((tr) => {
          const cells = [...tr.querySelectorAll('td,th')].map((c) => c.textContent.trim());
          return { label: cells[0] || '', value: cells[1] || '' };
        });
      }
    }
    return rows;
  };

  const formRows = getRows('checkout-form', 'checkout form');
  const summaryRows = getRows('order-summary', 'order summary');

  const findRow = (rows, key) => rows.find((r) => r.label.toLowerCase().includes(key))?.value || '';
  const splitVals = (val) => val
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  const config = {
    titles: splitVals(findRow(formRows, 'title options')) || defaults.titles,
    emailVerifyLabel: findRow(formRows, 'email verify label') || defaults.emailVerifyLabel,
    numberOptions: splitVals(findRow(formRows, 'number bring options')) || defaults.numberOptions,
    providers: splitVals(findRow(formRows, 'providers')) || defaults.providers,
    simTypes: splitVals(findRow(formRows, 'sim types')) || defaults.simTypes,
    links: splitVals(findRow(formRows, 'links')) || defaults.links,
    primaryCta: findRow(formRows, 'primary cta') || defaults.primaryCta,

    // New Keys Parsing
    sectionTitleDetails: findRow(formRows, 'section title details') || defaults.sectionTitleDetails,
    firstNamePlaceholder: findRow(formRows, 'first name placeholder') || defaults.firstNamePlaceholder,
    lastNamePlaceholder: findRow(formRows, 'last name placeholder') || defaults.lastNamePlaceholder,
    emailPlaceholder: findRow(formRows, 'email placeholder') || defaults.emailPlaceholder,
    emailHelper: findRow(formRows, 'email helper') || defaults.emailHelper,

    sectionTitleTransfer: findRow(formRows, 'section title transfer') || defaults.sectionTitleTransfer,

    sectionTitleSim: findRow(formRows, 'section title sim') || defaults.sectionTitleSim,
    sectionSubheadingSim: findRow(formRows, 'section subheading sim') || defaults.sectionSubheadingSim,
    simInfoEsim: findRow(formRows, 'sim info esim') || defaults.simInfoEsim,
    simInfoSim: findRow(formRows, 'sim info sim') || defaults.simInfoSim,

    sectionTitleReview: findRow(formRows, 'section title review') || defaults.sectionTitleReview,
    sectionSubheadingReview: findRow(formRows, 'section subheading review') || defaults.sectionSubheadingReview,
    downloadContractInfo: findRow(formRows, 'download contract info') || defaults.downloadContractInfo,
    downloadContractSummary: findRow(formRows, 'download contract summary') || defaults.downloadContractSummary,

    sectionTitleAgreement: findRow(formRows, 'section title agreement') || defaults.sectionTitleAgreement,
    agreementToggleText: findRow(formRows, 'agreement toggle text') || defaults.agreementToggleText,

    // Order Summary Parsing
    summaryCostValues: splitVals(findRow(summaryRows, 'monthly cost')) || defaults.summaryCostValues,
    summaryPlanName: findRow(summaryRows, 'plan name') || defaults.summaryPlanName,
    summaryPlanFeatures: splitVals(findRow(summaryRows, 'plan features')) || defaults.summaryPlanFeatures,
    summarySecureCheckout: findRow(summaryRows, 'secure checkout') || defaults.summarySecureCheckout,
    summaryActivateEsim: findRow(summaryRows, 'how to activate esim') || defaults.summaryActivateEsim,
    summaryNotes: splitVals(findRow(summaryRows, 'notes')) || defaults.summaryNotes,
    summaryHelp: findRow(summaryRows, 'need help') || defaults.summaryHelp,
    summaryTitle: 'Order summary', // Usually the block name, but can be hardcoded or metadata
    summaryCostLabel: (window.location.pathname.includes('/fr/') || window.location.pathname.includes('/abo/')) ? 'Frais mensuel' : 'Monthly cost',
  };

  // If summary rows exist, we might want to prioritize them over session storage
  // defaults in some cases, currently the logic prefers session storage if it
  // exists (in decorateCheckoutLayout).
  // We will pass these as 'fallback' to the getCheckoutSelection logic or use them directly.

  return config;
}

export function decorateCheckoutLayout(main) {
  if (!document.body.classList.contains('paymonthly-checkout')) return;

  // Hide header and footer for checkout flow
  document.body.classList.add('checkout-hide-chrome');

  // safer than checking ".checkout-page" because authored content might accidentally contain it
  if (main.dataset.checkoutDecorated === 'true') return;
  main.dataset.checkoutDecorated = 'true';

  const config = parseCheckoutConfig(main);
  const selection = getCheckoutSelection();
  
  // URL Parameter Override
  const params = new URLSearchParams(window.location.search);
  const urlPlan = params.get('plan');
  const urlPrice = params.get('price');
  const urlPeriod = params.get('period');

  if (urlPlan || urlPrice) {
    if (urlPlan) selection.title = urlPlan;
    if (urlPrice) {
      selection.newPrice = urlPrice;
      selection.oldPrice = ''; // Hide old price when overridden
      
      if (urlPeriod === '1') {
        selection.subText = '(sans engagement)';
      } else if (urlPeriod === '24') {
        selection.subText = '';
      } else {
        selection.subText = '';
      }
      
      // Persist selection to session storage so it survives reloads
      sessionStorage.setItem(CHECKOUT_SELECTION_KEY, JSON.stringify(selection));
    }
    // Clean URL query params
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }

  const { node: logoNode, href: logoHref } = extractCheckoutLogo(main);

  // ✅ authorable H1 from metadata (falls back to old hardcoded text)
  const checkoutTitle = getMetadata('checkout-title') || 'My basket: Add-ons & more';

  const page = document.createElement('div');
  page.className = 'checkout-page';
  page.innerHTML = `
    <div class="checkout-hero">
    ${logoNode
    ? `<div class="checkout-logo"><a href="${logoHref}" target="_self">${logoNode.outerHTML}</a></div>`
    : ''}
      ${buildCheckoutSteps().outerHTML}
    </div>
    <div class="checkout-shell">
      <h1>${checkoutTitle}</h1>
      <div class="checkout-layout">
        <div class="checkout-main">
          <section class="checkout-card">
            <div class="card-header">
              <h2>${config.sectionTitleDetails}</h2>
            </div>
            <div class="field-grid three name-row">
              <label class="field">
                <select aria-label="Title">
                  <option value="" disabled selected>Select title</option>
                  ${config.titles.map((t) => `<option>${t}</option>`).join('')}
                </select>
              </label>
              <label class="field">
                <input type="text" placeholder="${config.firstNamePlaceholder}" aria-label="First name">
              </label>
              <label class="field">
                <input type="text" placeholder="${config.lastNamePlaceholder}" aria-label="Last name">
              </label>
            </div>
            <div class="field-grid email-row">
              <label class="field full">
                <div class="field-inline email-verify-wrapper">
                  <input type="email" placeholder="${config.emailPlaceholder}" aria-label="Enter your e-mail address">
                  <button class="ghost-button verify-btn" type="button" disabled>${config.emailVerifyLabel}</button>
                </div>
                <small>${config.emailHelper}</small>
              </label>
            </div>
          </section>

        <section class="checkout-card number-transfer-card">
          <div class="card-header">
            <h2>${config.sectionTitleTransfer}</h2>
          </div>

          <div class="number-transfer-options">
             <label class="transfer-option">
                <input type="radio" name="transfer-choice" value="yes">
                <div class="option-content">
                    <span>${config.numberOptions?.[0] || 'I have a number to transfer'}</span>
                    <span class="change-link hidden">Change</span>
                </div>
             </label>
             <label class="transfer-option">
                <input type="radio" name="transfer-choice" value="no">
                <div class="option-content">
                    <span>${config.numberOptions?.[1] || 'No, I want a new number'}</span>
                </div>
             </label>
          </div>

          <div class="transfer-flow hidden">
            <div class="pill-options provider-options">
                ${config.providers.map((prov, idx) => `
                <label class="pill ${idx === 0 ? 'active' : ''}">
                <input type="radio" name="provider" ${idx === 0 ? 'checked' : ''}>
                <span>${prov}</span>
                </label>`).join('')}
            </div>
            <div class="transfer-fields">
                <div class="field-grid">
                    <label class="field full">
                        <div class="field-inline compact phone-input-row">
                        <input class="prefix" type="text" value="+44" aria-label="Country code" readonly>
                        <input class="phone-input" type="text" placeholder="Number you want to keep">
                        </div>
                        <small class="passcode-text hidden">You will receive one time passcode to this number</small>
                    </label>
                </div>
                <div class="field-grid pac-row">
                    <label class="field full">
                        <input type="text" placeholder="Porting authorisation code (PAC)">
                    </label>
                </div>
                <div class="field-grid date-row">
                    <label class="field full">
                        <div class="date-input-wrapper custom-date-box">
                             <div class="date-label">Port in date</div>
                             <input class="visible-date-input" type="text" placeholder="DD/MM/YYYY" readonly>
                             <input class="hidden-date-input" type="date">
                             <button type="button" class="calendar-btn">
                                <img src="https://www.lycamobile.co.uk/paymonthly/_next/static/media/blueCalendarIcon.037f492f.svg" alt="calendar" width="16" height="16">
                             </button>
                        </div>
                        <small>Your number will be transferred on the requested day and not before</small>
                    </label>
                </div>
                <button class="primary-button disabled confirm-mobile-btn" type="button">Confirm mobile number</button>
            </div>
          </div>
        </section>

        <section class="checkout-card sim-type-card">
          <div class="card-header">
            <h2>${config.sectionTitleSim}</h2>
            <p class="sub-heading">${config.sectionSubheadingSim}</p>
          </div>
          <div class="sim-options">
            <label class="sim-option active">
              <input type="radio" name="sim-type" value="esim" checked>
              <div class="option-content">
                  <img src="https://www.lycamobile.co.uk/paymonthly/_next/static/media/esimDark.5250605d.svg" alt="eSIM">
                  <span>eSIM</span>
                  <div class="check-icon"></div>
              </div>
              <div class="sim-info">
                  <div class="info-icon">i</div>
                  <p>${config.simInfoEsim}</p>
              </div>
            </label>
            <label class="sim-option">
              <input type="radio" name="sim-type" value="sim">
              <div class="option-content">
                  <img src="https://www.lycamobile.co.uk/paymonthly/_next/static/media/Sim-card.5ed62f4a.svg" alt="SIM card">
                  <span>SIM card</span>
                  <div class="check-icon"></div>
              </div>
              <div class="sim-info hidden">
                  <div class="info-icon">i</div>
                  <p>${config.simInfoSim}</p>
              </div>
            </label>
          </div>
          <a href="#" class="more-info-link">${config.links?.[0] || "What's eSIM/Check compatibility"}</a>
        </section>

        <section class="checkout-card review-contract-card">
          <div class="card-header">
            <h2>${config.sectionTitleReview}</h2>
            <p class="sub-heading">${config.sectionSubheadingReview}</p>
          </div>
          <div class="download-list">
            <a class="download-card" href="#">
                <img src="https://cms-assets-paym.globalldplatform.com/uk/s3fs-public/inline-images/download.png?VersionId=NHRY2RecjJ.GXpYopIYlIakl9q5Uq9ei" alt="download">
                <span>${config.downloadContractInfo}</span>
            </a>
            <a class="download-card" href="#">
                <img src="https://cms-assets-paym.globalldplatform.com/uk/s3fs-public/inline-images/download.png?VersionId=NHRY2RecjJ.GXpYopIYlIakl9q5Uq9ei" alt="download">
                <span>${config.downloadContractSummary}</span>
            </a>
          </div>
          <a class="link-action view-formats" href="#">${config.links?.[1] || 'View other formats'}</a>
        </section>

        <section class="checkout-card checkout-agreement">
          <div class="card-header">
            <h2>${config.sectionTitleAgreement}</h2>
          </div>
          <div class="toggle-wrapper">
             <label class="switch">
                <input type="checkbox" id="contract-toggle">
                <span class="slider round"></span>
             </label>
             <span class="toggle-label">${config.agreementToggleText} <a href="#">${config.links?.[2] || 'Terms and conditions'}</a></span>
          </div>
        </section>

        <div class="checkout-actions">
            <button class="primary-button checkout-btn disabled" type="button">${config.primaryCta}</button>
        </div>
      </div>

      <aside class="checkout-sidebar">
        <div class="summary-card cost-card">
            <h2 class="summary-title">${config.summaryTitle}</h2>
            <div class="summary-row">
                <div class="cost-label">${config.summaryCostLabel}</div>
                <div class="cost-values">
                    <span class="old-price">${config.summaryCostValues[0]}</span>
                    <span class="new-price">${config.summaryCostValues[1]}</span>
                </div>
            </div>
            <div class="cost-note">${config.summaryCostValues[2] || ''}</div>
            <div class="basket-actions">
                <button class="delete-btn" aria-label="Remove item">
                    <img src="https://www.lycamobile.co.uk/paymonthly/_next/static/media/trash.d2556b6a.svg" alt="remove">
                </button>
            </div>
        </div>

        <div class="summary-card plan-card">
             <h3 class="plan-name">${config.summaryPlanName}</h3>
             <ul class="plan-features">
                ${config.summaryPlanFeatures.map((f) => `<li>${f}</li>`).join('')}
             </ul>
        </div>

        <div class="summary-card info-card">
            <div class="info-item">
                <img src="https://cms-pim-assets-dev.ldsvcplatform.com/POSTPAID/s3fs-public/inline-images/Group%20383184241%20%281%29.png" alt="secure">
                <span>${config.summarySecureCheckout}</span>
            </div>
            <div class="info-item">
                 <img src="https://cms-assets-paym.globalldplatform.com/uk/s3fs-public/image.jpg" alt="esim">
                 <span>${config.summaryActivateEsim}</span>
            </div>
            <div class="info-item start-align">
                 <img src="https://cms-assets-paym.globalldplatform.com/uk/s3fs-public/Spend%20cap-2.webp" alt="timer">
                 <span>${config.summaryNotes.join('<br>')}</span>
            </div>

            <p class="service-note">${config.summaryNotes[2] || ''}</p>
            <p class="help-link">${config.summaryHelp}</p>
        </div>
      </aside>
    </div>
  `;

  main.replaceChildren(page);

  // Force clear old price and english/french subtext for FR pages as requested
  if (window.location.pathname.includes('/fr/') || window.location.pathname.includes('/abo/')) {
      selection.oldPrice = '';
      if (!selection.subText 
          || selection.subText.includes('for the first 6 months')
          || selection.subText.includes('mois')
          || selection.subText.includes('pour')) {
          selection.subText = '';
      }
  }

  // apply selected plan details (priority: session storage > authoring config)
  // We want session storage to override if present, otherwise default to config
  const displaySelection = {
    oldPrice: selection.oldPrice !== undefined ? selection.oldPrice : config.summaryCostValues[0],
    newPrice: selection.newPrice || config.summaryCostValues[1],
    subText: selection.subText !== undefined ? selection.subText : config.summaryCostValues[2],
    title: selection.title || config.summaryPlanName,
    features: (selection.features && selection.features.length)
      ? selection.features
      : config.summaryPlanFeatures,
  };

  if (displaySelection) {
    const oldPriceEl = page.querySelector('.old-price');
    const newPriceEl = page.querySelector('.new-price');
    const noteEl = page.querySelector('.cost-note');
    if (oldPriceEl) oldPriceEl.textContent = displaySelection.oldPrice || '';
    if (newPriceEl) newPriceEl.textContent = displaySelection.newPrice || '';
    if (noteEl && displaySelection.subText !== undefined) noteEl.textContent = displaySelection.subText;

    const planNameEl = page.querySelector('.plan-name');
    if (planNameEl && displaySelection.title) planNameEl.textContent = displaySelection.title;

    const planFeaturesEl = page.querySelector('.plan-features');
    // Ensure we don't duplicate if already populated by template?
    // Template populated it with config.summaryPlanFeatures.
    // If session storage differs, we wipe and re-add.
    if (planFeaturesEl && displaySelection.features.length) {
      planFeaturesEl.innerHTML = '';
      displaySelection.features.forEach((feature) => {
        const li = document.createElement('li');
        li.textContent = feature;
        planFeaturesEl.append(li);
      });
    }
  }

  // interactions (unchanged from your version)
  const transferOptions = [...page.querySelectorAll('input[name="transfer-choice"]')];
  const transferFlow = page.querySelector('.transfer-flow');
  const providerPills = [...page.querySelectorAll('.provider-options .pill')];

  const pacRow = page.querySelector('.pac-row');
  const dateRow = page.querySelector('.date-row');
  const passcodeText = page.querySelector('.passcode-text');
  const phoneInput = page.querySelector('.phone-input');

  const toggleTransferFlow = () => {
    const selected = page.querySelector('input[name="transfer-choice"]:checked');
    const isTransfer = selected && selected.value === 'yes';

    transferOptions.forEach((input) => {
      const label = input.closest('.transfer-option');
      if (label) {
        if (input.checked) label.classList.add('active');
        else label.classList.remove('active');

        const changeLink = label.querySelector('.change-link');
        if (changeLink) {
          if (input.checked && input.value === 'yes') changeLink.classList.remove('hidden');
          else changeLink.classList.add('hidden');
        }
      }
    });

    const noOptionInput = page.querySelector('input[name="transfer-choice"][value="no"]');
    const noOptionLabel = noOptionInput?.closest('.transfer-option');
    if (noOptionLabel) {
      if (isTransfer) noOptionLabel.classList.add('hidden');
      else noOptionLabel.classList.remove('hidden');
    }

    if (transferFlow) {
      if (isTransfer) transferFlow.classList.remove('hidden');
      else transferFlow.classList.add('hidden');
    }
  };

  transferOptions.forEach((opt) => opt.addEventListener('change', toggleTransferFlow));

  const changeLink = page.querySelector('.change-link');
  if (changeLink) {
    changeLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      transferOptions.forEach((opt) => { opt.checked = false; });
      toggleTransferFlow();
    });
  }

  toggleTransferFlow();

  const updateProviderState = (pill) => {
    const isLyca = pill.innerText.includes('Lyca Mobile');
    const input = pill.querySelector('input');

    providerPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    if (input) input.checked = true;

    if (isLyca) {
      pacRow?.classList.add('hidden');
      dateRow?.classList.add('hidden');
      passcodeText?.classList.remove('hidden');
      if (phoneInput) phoneInput.placeholder = 'Enter a Lyca Mobile number';
    } else {
      pacRow?.classList.remove('hidden');
      dateRow?.classList.remove('hidden');
      passcodeText?.classList.add('hidden');
      if (phoneInput) phoneInput.placeholder = 'Number you want to keep';
    }
  };

  providerPills.forEach((pill) => {
    pill.addEventListener('click', () => updateProviderState(pill));
    if (pill.classList.contains('active')) updateProviderState(pill);
  });

  const newSimOptions = [...page.querySelectorAll('.sim-option')];
  newSimOptions.forEach((opt) => {
    opt.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;

      const input = opt.querySelector('input');
      if (input) input.checked = true;

      newSimOptions.forEach((o) => {
        o.classList.remove('active');
        const info = o.querySelector('.sim-info');
        if (info) info.classList.add('hidden');
      });

      opt.classList.add('active');
      const info = opt.querySelector('.sim-info');
      if (info) info.classList.remove('hidden');
    });

    const input = opt.querySelector('input');
    if (input) {
      input.addEventListener('change', () => {
        if (input.checked) {
          newSimOptions.forEach((o) => {
            o.classList.remove('active');
            const info = o.querySelector('.sim-info');
            if (info) info.classList.add('hidden');
          });
          opt.classList.add('active');
          const info = opt.querySelector('.sim-info');
          if (info) info.classList.remove('hidden');
        }
      });
    }
  });

  const contractToggle = page.querySelector('#contract-toggle');
  const checkoutBtn = page.querySelector('.checkout-btn');
  const emailInput = page.querySelector('.email-verify-wrapper input[type="email"]');
  const emailWrapper = page.querySelector('.email-verify-wrapper');
  const verifyBtn = page.querySelector('.verify-btn');
  let emailError = emailWrapper?.parentElement?.querySelector('.email-error');
  if (!emailError && emailWrapper?.parentElement) {
    emailError = document.createElement('div');
    emailError.className = 'email-error';
    emailError.textContent = 'Email is invalid';
    const helperText = emailWrapper.parentElement.querySelector('small');
    if (helperText) helperText.before(emailError);
    else emailWrapper.parentElement.append(emailError);
  }

  const isEmailValid = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || '').trim());
  const debounce = (fn, wait = 200) => {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), wait);
    };
  };

  const updateCheckoutState = () => {
    const emailOk = emailInput ? isEmailValid(emailInput.value) : false;
    const ready = emailOk;

    if (verifyBtn) verifyBtn.disabled = !emailOk;

    if (emailWrapper) {
      const showError = emailInput && emailInput.value.trim() && !emailOk;
      emailWrapper.classList.toggle('invalid', showError);
      if (emailError) emailError.classList.toggle('visible', showError);
    }

    if (!checkoutBtn) return;
    checkoutBtn.disabled = !ready;
    checkoutBtn.classList.toggle('disabled', !ready);
  };

  const debouncedUpdateCheckoutState = debounce(updateCheckoutState, 200);

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      updateCheckoutState();
      debouncedUpdateCheckoutState();
    });
    emailInput.addEventListener('change', updateCheckoutState);
    emailInput.addEventListener('blur', updateCheckoutState);
  }

  if (contractToggle) contractToggle.addEventListener('change', updateCheckoutState);

  updateCheckoutState();

  const dateWrapper = page.querySelector('.date-input-wrapper');
  const visibleDateInput = dateWrapper?.querySelector('.visible-date-input');
  const hiddenDateInput = dateWrapper?.querySelector('.hidden-date-input');
  const calendarBtn = dateWrapper?.querySelector('.calendar-btn');

  if (visibleDateInput && hiddenDateInput && calendarBtn) {
    const openPicker = () => {
      try { hiddenDateInput.showPicker(); } catch (e) { hiddenDateInput.focus(); }
    };

    calendarBtn.addEventListener('click', openPicker);
    visibleDateInput.addEventListener('click', openPicker);

    hiddenDateInput.addEventListener('change', (e) => {
      const val = e.target.value; // YYYY-MM-DD
      if (val) {
        const [year, month, day] = val.split('-');
        visibleDateInput.value = `${day}/${month}/${year}`;
      } else {
        visibleDateInput.value = '';
      }
    });
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  const { pathname } = window.location;

  const template = getMetadata('template');
  if (template) document.body.classList.add(`paymonthly-${template}`);

  const isCheckoutNoChrome = pathname.includes('/paymonthly/en/checkout/checkout');
  const isCheckout = template === 'checkout';
  if (isCheckout) document.body.classList.add('paymonthly-checkout');
  if (isCheckoutNoChrome) document.body.classList.add('checkout-hide-chrome');

  // eslint-disable-next-line no-unused-vars
  decorateTemplateAndTheme();

  // Martech Plugin initialization
  const martechLoadedPromise = initMartech(
    // 1. WebSDK Configuration
    // Docs: https://experienceleague.adobe.com/en/docs/experience-platform/web-sdk/commands/configure/overview#configure-js
    {
      datastreamId: 'c3040c2e-07d6-446c-8f3c-d3f500ff3113',
      orgId: '09CF60665F98CEF90A495FF8@AdobeOrg',
      defaultConsent: 'in',
      // The `debugEnabled` flag is automatically set to true on localhost and .page URLs.
      // The `defaultConsent` is automatically set to "pending".
      // eslint-disable-next-line no-unused-vars
      onBeforeEventSend: (payload) => {
        // This callback allows you to modify the payload before it's sent.
        // Return false to prevent the event from being sent.
      },
      edgeConfigOverrides: {
        // Optional datastream overrides for different environments.
      },
    },
    // 2. Library Configuration
    {
      personalization: !!getMetadata('target'),
      launchUrls: [
        'https://assets.adobedtm.com/0e9a0418089e/4efb62083c74/launch-7537c509f5f7-development.min.js',
      ],
      // See the API Reference for all available options.
    },
  );

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    decorateCheckoutLayout(main);
    document.body.classList.add('appear');
    const section = main.querySelector('.section') || main.querySelector('.checkout-hero');
    if (section) {
      await Promise.all([
        martechLoadedPromise.then(martechEager),
        loadSection(section, waitForFirstImage),
      ]);
    }
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  await martechLazy();

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  window.setTimeout(() => {
    martechDelayed();
    // eslint-disable-next-line import/no-cycle
    import('./delayed.js');
  }, 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
