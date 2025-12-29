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
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
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

function buildCheckoutShell(main) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="section checkout-hero"><div><h1>My basket: Add-ons &amp; more</h1></div></div>
    <div class="section checkout-shell">
      <div class="checkout-page">
        <div class="checkout-steps">
          <div class="step active">Basket</div>
          <div class="step next">Credit check</div>
          <div class="step">Delivery and payment</div>
          <div class="step-progress"><span></span></div>
        </div>
        <div class="checkout-layout">
          <div class="checkout-main">
            <section class="checkout-card">
              <div class="card-header">
                <h2>Your Details</h2>
              </div>
              <div class="field-grid three">
                <label class="field">
                  <span class="field-label">Title</span>
                  <select aria-label="Title">
                    <option value="">Select title</option>
                    <option>Mr</option>
                    <option>Mrs</option>
                    <option>Ms</option>
                    <option>Miss</option>
                    <option>Dr</option>
                  </select>
                </label>
                <label class="field">
                  <span class="field-label">First name *</span>
                  <input type="text" placeholder="Enter first name">
                </label>
                <label class="field">
                  <span class="field-label">Last name *</span>
                  <input type="text" placeholder="Enter last name">
                </label>
              </div>
              <div class="field-grid">
                <label class="field full">
                  <span class="field-label">Enter your e-mail address *</span>
                  <div class="field-inline">
                    <input type="email" placeholder="Enter your e-mail address">
                    <button class="ghost-button" type="button">Verify</button>
                  </div>
                  <small>We need this to send you the order confirmation and dispatch updates.</small>
                </label>
              </div>
            </section>

            <section class="checkout-card">
              <div class="card-header">
                <h2>Do you have a number to bring?</h2>
                <a class="link-action" href="#">Change</a>
              </div>
              <label class="field full select-line">
                <select aria-label="Number choice">
                  <option>I have a number to transfer</option>
                  <option>No, I want a new number</option>
                </select>
              </label>
              <div class="pill-options">
                <label class="pill active">
                  <input type="radio" name="provider" checked>
                  <span>Lyca Mobile</span>
                </label>
                <label class="pill">
                  <input type="radio" name="provider">
                  <span>Other service provider</span>
                </label>
              </div>
              <div class="field-grid three">
                <label class="field">
                  <span class="field-label">Number you want to keep</span>
                  <div class="field-inline compact">
                    <input class="prefix" type="text" value="+44" aria-label="Country code">
                    <input type="text" placeholder="Enter a Lyca Mobile number">
                  </div>
                  <small>You will receive one time passcode to this number</small>
                </label>
                <label class="field">
                  <span class="field-label">Porting authorisation code (PAC)</span>
                  <input type="text" placeholder="PAC e.g. ABC123456">
                </label>
                <label class="field">
                  <span class="field-label">Port in date</span>
                  <input type="text" placeholder="DD/MM/YYYY">
                  <small>Your number will be transferred on the requested day and not before</small>
                </label>
              </div>
              <button class="primary-button disabled" type="button">Confirm mobile number</button>
            </section>

            <section class="checkout-card">
              <div class="card-header">
                <h2>SIM type</h2>
                <p class="muted">Choose your preferred type of SIM</p>
              </div>
              <div class="option-list">
                <label class="option active">
                  <input type="radio" name="sim-type" checked>
                  <div class="option-body">
                    <div class="option-title">eSIM</div>
                    <small>Your Lyca Mobile SIM must be activated in the UK, once your SIM is activated in the UK, you can use it internationally according to your mobile plan.</small>
                  </div>
                </label>
                <label class="option">
                  <input type="radio" name="sim-type">
                  <div class="option-body">
                    <div class="option-title">SIM card</div>
                  </div>
                </label>
                <a class="link-action" href="#">What's eSIM/Check compatibility</a>
              </div>
            </section>

            <section class="checkout-card">
              <div class="card-header">
                <h2>Review contract details</h2>
                <p class="muted">We have also sent these to</p>
              </div>
              <div class="download-list">
                <a class="download" href="#"><span class="icon-download"></span>Download contract information</a>
                <a class="download" href="#"><span class="icon-download"></span>Download contract summary</a>
              </div>
              <a class="link-action" href="#">View other formats</a>
            </section>

            <section class="checkout-card checkout-agreement">
              <div class="card-header">
                <h2>Contract agreement</h2>
              </div>
              <label class="toggle">
                <input type="checkbox">
                <span>Please confirm that you're happy with the contract summary and information before you proceed. View full <a href="#">Terms and conditions</a></span>
              </label>
              <button class="primary-button disabled" type="button">Checkout now</button>
            </section>
          </div>

          <aside class="checkout-sidebar">
            <div class="summary-card pricing">
              <div class="summary-row">
                <div>
                  <div class="summary-label">Monthly cost</div>
                  <div class="summary-note">for the first 6 months, then &pound;18</div>
                </div>
                <div class="summary-price"><del>&pound;18.00</del> <strong>&pound;9.00</strong></div>
              </div>
              <div class="summary-divider"></div>
              <ul class="summary-features">
                <li>24 month Unlimited</li>
                <li>30GB EU roaming included</li>
                <li>100 International minutes</li>
                <li>Unlimited UK mins and text</li>
                <li>Unlimited EU mins and text when roaming in EU (fair use policy applies)</li>
              </ul>
            </div>

            <div class="summary-card secure">
              <div class="summary-label">Secure checkout</div>
              <p class="muted"><a href="#">How to activate eSIM?</a></p>
              <ul class="summary-notes">
                <li>Spend cap is set to &pound;0.00. You can change this later on Lyca mobile app</li>
                <li>Please note the cost of other services you take from us may increase or decrease while you are a Lyca customer.</li>
              </ul>
              <p class="muted">Need help? Find our <a href="#">FAQ</a> related to order checkout</p>
            </div>
          </aside>
        </div>
      </div>
    </div>`;

  main.innerHTML = '';
  main.append(...wrapper.children);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const { pathname } = window.location;
  const isCheckout = pathname.includes('/paymonthly/en/checkout') || pathname.endsWith('/checkout') || pathname.includes('/checkout/');
  if (pathname.includes('/paymonthly/en/bundles/sim-only-deals')) {
    document.body.classList.add('paymonthly-sim-only-deals');
  }
  if (isCheckout) {
    document.body.classList.add('paymonthly-checkout');
    const mainEl = doc.querySelector('main');
    if (mainEl) {
      buildCheckoutShell(mainEl);
    }
  }
  // eslint-disable-next-line no-unused-vars
  const isConsentGiven = true;

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
      launchUrls: ['https://assets.adobedtm.com/0e9a0418089e/4efb62083c74/launch-7537c509f5f7-development.min.js'],
      // See the API Reference for all available options.
    },
  );

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
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
