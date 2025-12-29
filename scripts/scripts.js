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
  };

  const table = [...main.querySelectorAll('table')].find((tbl) => tbl.textContent.toLowerCase().includes('checkout form'));
  if (!table) return defaults;

  const rows = [...table.querySelectorAll('tr')].map((tr) => {
    const cells = [...tr.querySelectorAll('td,th')].map((c) => c.textContent.trim());
    return { label: cells[0] || '', value: cells[1] || '' };
  });

  const findRow = (key) => rows.find((r) => r.label.toLowerCase().includes(key))?.value || '';
  const splitVals = (val) => val
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    titles: splitVals(findRow('title options')) || defaults.titles,
    emailVerifyLabel:
      findRow('email verify label') || defaults.emailVerifyLabel,
    numberOptions:
      splitVals(findRow('number bring options')) || defaults.numberOptions,
    providers: splitVals(findRow('providers')) || defaults.providers,
    simTypes: splitVals(findRow('sim types')) || defaults.simTypes,
    links: splitVals(findRow('links')) || defaults.links,
    primaryCta: findRow('primary cta') || defaults.primaryCta,
  };
}

export function decorateCheckoutLayout(main) {
  if (!document.body.classList.contains('paymonthly-checkout')) return;
  if (main.querySelector('.checkout-page')) return;

  const config = parseCheckoutConfig(main);
  const selection = getCheckoutSelection();
  const { node: logoNode, href: logoHref } = extractCheckoutLogo(main);

  const page = document.createElement('div');
  page.className = 'checkout-page';
  page.innerHTML = `
    <div class="checkout-hero">
      ${
  logoNode
    ? `<div class="checkout-logo"><a href="${logoHref}" target="_self">${logoNode.outerHTML}</a></div>`
    : ''
}
      ${buildCheckoutSteps().outerHTML}
    </div>
    <div class="checkout-shell">
      <h1>My basket: Add-ons &amp; more</h1>
      <div class="checkout-layout">
        <div class="checkout-main">
          <section class="checkout-card">
            <div class="card-header">
              <h2>Your Details</h2>
            </div>
            <div class="field-grid three name-row">
              <label class="field">
                <select aria-label="Title">
                  <option value="" disabled selected>Select title</option>
                  ${config.titles.map((t) => `<option>${t}</option>`).join('')}
                </select>
              </label>
              <label class="field">
                <input type="text" placeholder="Enter first name" aria-label="First name">
              </label>
              <label class="field">
                <input type="text" placeholder="Enter last name" aria-label="Last name">
              </label>
            </div>
            <div class="field-grid email-row">
              <label class="field full">
                <div class="field-inline email-verify-wrapper">
                  <input type="email" placeholder="Enter your e-mail address" aria-label="Enter your e-mail address">
                  <button class="ghost-button verify-btn" type="button" disabled>${config.emailVerifyLabel}</button>
                </div>
                <small>We need this to send you the order confirmation and dispatch updates.</small>
              </label>
            </div>
          </section>

        <section class="checkout-card number-transfer-card">
          <div class="card-header">
            <h2>Do you have a number to bring?</h2>
          </div>
          
          <div class="number-transfer-options">
             <label class="transfer-option">
                <input type="radio" name="transfer-choice" value="yes">
                <div class="option-content">
                    <span>I have a number to transfer</span>
                    <span class="change-link hidden">Change</span>
                </div>
             </label>
             <label class="transfer-option">
                <input type="radio" name="transfer-choice" value="no">
                <div class="option-content">
                    <span>No, I want a new number</span>
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
            <h2>SIM type</h2>
            <p class="sub-heading">Choose your preferred type of SIM</p>
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
                  <p>Your Lyca Mobile SIM must be activated in the UK, once your SIM is activated in the UK, you can use it internationally according to your mobile plan.</p>
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
                  <p>A SIM card will be sent to your delivery address.</p>
              </div>
            </label>
          </div>
          <a href="#" class="more-info-link">What's eSIM/Check compatibility</a>
        </section>



        <section class="checkout-card review-contract-card">
          <div class="card-header">
            <h2>Review contract details</h2>
            <p class="sub-heading">We have also sent these to</p>
          </div>
          <div class="download-list">
            <a class="download-card" href="#">
                <img src="https://cms-assets-paym.globalldplatform.com/uk/s3fs-public/inline-images/download.png?VersionId=NHRY2RecjJ.GXpYopIYlIakl9q5Uq9ei" alt="download">
                <span>Download contract information</span>
            </a>
            <a class="download-card" href="#">
                <img src="https://cms-assets-paym.globalldplatform.com/uk/s3fs-public/inline-images/download.png?VersionId=NHRY2RecjJ.GXpYopIYlIakl9q5Uq9ei" alt="download">
                <span>Download contract summary</span>
            </a>
          </div>
          <a class="link-action view-formats" href="#">View other formats</a>
        </section>

        <section class="checkout-card checkout-agreement">
          <div class="card-header">
            <h2>Contract agreement</h2>
          </div>
          <div class="toggle-wrapper">
             <label class="switch">
                <input type="checkbox" id="contract-toggle">
                <span class="slider round"></span>
             </label>
             <span class="toggle-label">Please confirm that you're happy with the contract summary and information before you proceed. View full <a href="#">Terms and conditions</a></span>
          </div>
        </section>
        
        <div class="checkout-actions">
            <button class="primary-button checkout-btn disabled" type="button">Checkout now</button>
        </div>
      </div>

      <aside class="checkout-sidebar">
        <!-- Card 1: Header & Cost -->
        <div class="summary-card cost-card">
            <h2 class="summary-title">Order summary</h2>
            <div class="summary-row">
                <div class="cost-label">Monthly cost</div>
                <div class="cost-values">
                    <span class="old-price">£18.00</span>
                    <span class="new-price">£9.00</span>
                </div>
            </div>
            <div class="cost-note">for the first 6 months, then £18</div>
            <div class="basket-actions">
                <button class="delete-btn" aria-label="Remove item">
                    <img src="https://www.lycamobile.co.uk/paymonthly/_next/static/media/trash.d2556b6a.svg" alt="remove">
                </button>
            </div>
        </div>

        <!-- Card 2: Plan Details -->
        <div class="summary-card plan-card">
             <h3 class="plan-name">24 month Unlimited</h3>
             <ul class="plan-features">
                <li>30GB EU roaming included</li>
                <li>100 International minutes</li>
                <li>Unlimited UK mins and text</li>
                <li>Unlimited EU mins and text when roaming in EU (fair use policy applies)</li>
             </ul>
        </div>

        <!-- Card 3: Secure Checkout Info -->
        <div class="summary-card info-card">
            <div class="info-item">
                <img src="https://cms-pim-assets-dev.ldsvcplatform.com/POSTPAID/s3fs-public/inline-images/Group%20383184241%20%281%29.png" alt="secure">
                <span>Secure checkout</span>
            </div>
            <div class="info-item">
                 <img src="https://cms-assets-paym.globalldplatform.com/uk/s3fs-public/image.jpg" alt="esim">
                 <span>How to activate <a href="#">eSim?</a></span>
            </div>
            <div class="info-item start-align">
                 <img src="https://cms-assets-paym.globalldplatform.com/uk/s3fs-public/Spend%20cap-2.webp" alt="timer">
                 <span>Spend cap is set to £0.00.<br>You can change this later on Lyca mobile app</span>
            </div>
            
            <p class="service-note">Please note the cost of other services you take from us may increase or decrease while you are a Lyca customer.</p>
            
            <p class="help-link">Need help? Find our <a href="#">FAQ</a> related to order checkout</p>
        </div>
      </aside>
    </div>
  `;

  main.replaceChildren(page);

  // apply selected plan details (if available)
  if (selection) {
    const oldPriceEl = page.querySelector('.old-price');
    const newPriceEl = page.querySelector('.new-price');
    const noteEl = page.querySelector('.cost-note');
    if (oldPriceEl) oldPriceEl.textContent = selection.oldPrice || '';
    if (newPriceEl) newPriceEl.textContent = selection.newPrice || '';
    if (noteEl && selection.subText) noteEl.textContent = selection.subText;

    const planNameEl = page.querySelector('.plan-name');
    if (planNameEl && selection.title) planNameEl.textContent = selection.title;

    const planFeaturesEl = page.querySelector('.plan-features');
    if (planFeaturesEl && Array.isArray(selection.features) && selection.features.length) {
      planFeaturesEl.innerHTML = '';
      selection.features.forEach((feature) => {
        const li = document.createElement('li');
        li.textContent = feature;
        planFeaturesEl.append(li);
      });
    }
  }

  // interactions
  const transferOptions = [...page.querySelectorAll('input[name="transfer-choice"]')];
  const transferFlow = page.querySelector('.transfer-flow');
  const providerPills = [...page.querySelectorAll('.provider-options .pill')];

  // Elements for dynamic visibility
  const pacRow = page.querySelector('.pac-row');
  const dateRow = page.querySelector('.date-row');
  const passcodeText = page.querySelector('.passcode-text');
  const phoneInput = page.querySelector('.phone-input');

  const toggleTransferFlow = () => {
    const selected = page.querySelector('input[name="transfer-choice"]:checked');
    const isTransfer = selected && selected.value === 'yes';

    // Update active classes on main options
    transferOptions.forEach((input) => {
      const label = input.closest('.transfer-option');
      if (label) {
        if (input.checked) label.classList.add('active');
        else label.classList.remove('active');

        // Toggle change link
        const changeLink = label.querySelector('.change-link');
        if (changeLink) {
          if (input.checked && input.value === 'yes') changeLink.classList.remove('hidden');
          else changeLink.classList.add('hidden');
        }
      }
    });

    // Hide/Show "No" option based on "Yes" selection
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

  // Handle Change link click
  const changeLink = page.querySelector('.change-link');
  if (changeLink) {
    changeLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent label click
      // Reset selection
      transferOptions.forEach((opt) => {
        // eslint-disable-next-line no-param-reassign
        opt.checked = false;
      });
      toggleTransferFlow();
    });
  }

  // Initial state
  toggleTransferFlow();

  const updateProviderState = (pill) => {
    const isLyca = pill.innerText.includes('Lyca Mobile');
    const input = pill.querySelector('input');

    providerPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    if (input) input.checked = true;

    // Toggle fields
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
    // Check initial state
    if (pill.classList.contains('active')) {
      updateProviderState(pill);
    }
  });

  // New SIM Type Logic
  const newSimOptions = [...page.querySelectorAll('.sim-option')];
  newSimOptions.forEach((opt) => {
    opt.addEventListener('click', (e) => {
      // Prevent double firing if clicking input directly
      if (e.target.tagName === 'INPUT') return;

      const input = opt.querySelector('input');
      if (input) input.checked = true;

      // Update UI
      newSimOptions.forEach((o) => {
        o.classList.remove('active');
        const info = o.querySelector('.sim-info');
        if (info) info.classList.add('hidden');
      });

      opt.classList.add('active');
      const info = opt.querySelector('.sim-info');
      if (info) info.classList.remove('hidden');
    });

    // Handle radio change if triggered via keyboard/direct input
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

  // Checkout Agreement Toggle Logic
  const contractToggle = page.querySelector('#contract-toggle');
  const checkoutBtn = page.querySelector('.checkout-btn');

  if (contractToggle && checkoutBtn) {
    contractToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        checkoutBtn.classList.remove('disabled');
        checkoutBtn.disabled = false;
      } else {
        checkoutBtn.classList.add('disabled');
        checkoutBtn.disabled = true;
      }
    });
  }

  // Date picker logic
  const dateWrapper = page.querySelector('.date-input-wrapper');
  const visibleDateInput = dateWrapper?.querySelector('.visible-date-input');
  const hiddenDateInput = dateWrapper?.querySelector('.hidden-date-input');
  const calendarBtn = dateWrapper?.querySelector('.calendar-btn');

  if (visibleDateInput && hiddenDateInput && calendarBtn) {
    const openPicker = () => {
      try {
        hiddenDateInput.showPicker();
      } catch (e) {
        hiddenDateInput.focus();
      }
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
    await Promise.all([
      martechLoadedPromise.then(martechEager),
      loadSection(main.querySelector('.section'), waitForFirstImage),
    ]);
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
