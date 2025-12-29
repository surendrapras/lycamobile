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
} from "./aem.js";

import {
  initMartech,
  martechEager,
  martechLazy,
  martechDelayed,
  // eslint-disable-next-line import/no-relative-packages
} from "../plugins/martech/src/index.js";

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector("h1");
  const picture = main.querySelector("picture");
  // eslint-disable-next-line no-bitwise
  if (
    h1 &&
    picture &&
    h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING
  ) {
    // Check if h1 or picture is already inside a hero block
    if (h1.closest(".hero") || picture.closest(".hero")) {
      return; // Don't create a duplicate hero block
    }
    const section = document.createElement("div");
    section.append(buildBlock("hero", { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes("localhost")) {
      sessionStorage.setItem("fonts-loaded", "true");
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
      import("../blocks/fragment/fragment.js").then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(frag.firstElementChild);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Fragment loading failed", error);
          }
        });
      });
    }

    buildHeroBlock(main);
    const isCheckout = document.body.classList;
    if (!isCheckout && !main.querySelector(".lyca-snow")) {
      const section = document.createElement("div");
      const snow = document.createElement("div");
      snow.className = "lyca-snow";
      section.append(snow);
      main.append(section);
    }
    // auto block lyca-snow
    if (!main.querySelector(".lyca-snow")) {
      const section = document.createElement("div");
      const snow = document.createElement("div");
      snow.className = "lyca-snow";
      section.append(snow);
      main.append(section);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Auto Blocking failed", error);
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

const CHECKOUT_SELECTION_KEY = "lyca.checkout.selectedPlan";

function normalizePrice(price, fallback) {
  const clean = (price || "")
    .replace(/¶œ\s*/gi, "£")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean && fallback) return fallback;
  return clean;
}

function getCheckoutSelection() {
  const defaults = {
    title: "24 month Unlimited",
    oldPrice: "£18.00",
    newPrice: "£9.00",
    subText: "for the first 6 months, then £18",
    features: [
      "30GB EU roaming included",
      "100 International minutes",
      "Unlimited UK mins and text",
      "Unlimited EU mins and text when roaming in EU (fair use policy applies)",
    ],
  };

  try {
    const stored = sessionStorage.getItem(CHECKOUT_SELECTION_KEY);
    if (!stored) return defaults;
    const parsed = JSON.parse(stored || "{}");
    const features =
      Array.isArray(parsed.features) && parsed.features.length
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

// function buildCheckoutShell(main) {
//   const selection = getCheckoutSelection();
//   const featureItems = [];
//   [selection.title, ...(selection.features || [])].forEach((item) => {
//     const clean = (item || "").trim();
//     if (clean && !featureItems.includes(clean)) featureItems.push(clean);
//   });
//   const priceHtml = `${
//     selection.oldPrice ? `<del>${selection.oldPrice}</del>` : ""
//   } ${
//     selection.newPrice ? `<strong>${selection.newPrice}</strong>` : ""
//   }`.trim();
//   const featuresHtml = featureItems.map((item) => `<li>${item}</li>`).join("");

//   const wrapper = document.createElement("div");
//   wrapper.innerHTML = `
//     <div class="section checkout-hero"><div><h1>My basket: Add-ons &amp; more</h1></div></div>
//     <div class="section checkout-shell">
//       <div class="checkout-page">
//         <div class="checkout-steps">
//           <div class="step active">Basket</div>
//           <div class="step next">Credit check</div>
//           <div class="step">Delivery and payment</div>
//           <div class="step-progress"><span></span></div>
//         </div>
//         <div class="checkout-layout">
//           <div class="checkout-main">
//             <section class="checkout-card">
//               <div class="card-header">
//                 <h2>Your Details</h2>
//               </div>
//               <div class="field-grid three">
//                 <label class="field">
//                   <span class="field-label">Title</span>
//                   <select aria-label="Title">
//                     <option value="">Select title</option>
//                     <option>Mr</option>
//                     <option>Mrs</option>
//                     <option>Ms</option>
//                     <option>Miss</option>
//                     <option>Dr</option>
//                   </select>
//                 </label>
//                 <label class="field">
//                   <span class="field-label">First name *</span>
//                   <input type="text" placeholder="Enter first name">
//                 </label>
//                 <label class="field">
//                   <span class="field-label">Last name *</span>
//                   <input type="text" placeholder="Enter last name">
//                 </label>
//               </div>
//               <div class="field-grid">
//                 <label class="field full">
//                   <span class="field-label">Enter your e-mail address *</span>
//                   <div class="field-inline">
//                     <input type="email" placeholder="Enter your e-mail address">
//                     <button class="ghost-button" type="button">Verify</button>
//                   </div>
//                   <small>We need this to send you the order confirmation and dispatch updates.</small>
//                 </label>
//               </div>
//             </section>

//             <section class="checkout-card">
//               <div class="card-header">
//                 <h2>Do you have a number to bring?</h2>
//                 <a class="link-action" href="#">Change</a>
//               </div>
//               <label class="field full select-line">
//                 <select aria-label="Number choice">
//                   <option>I have a number to transfer</option>
//                   <option>No, I want a new number</option>
//                 </select>
//               </label>
//               <div class="pill-options">
//                 <label class="pill active">
//                   <input type="radio" name="provider" checked>
//                   <span>Lyca Mobile</span>
//                 </label>
//                 <label class="pill">
//                   <input type="radio" name="provider">
//                   <span>Other service provider</span>
//                 </label>
//               </div>
//               <div class="field-grid three">
//                 <label class="field">
//                   <span class="field-label">Number you want to keep</span>
//                   <div class="field-inline compact">
//                     <input class="prefix" type="text" value="+44" aria-label="Country code">
//                     <input type="text" placeholder="Enter a Lyca Mobile number">
//                   </div>
//                   <small>You will receive one time passcode to this number</small>
//                 </label>
//                 <label class="field">
//                   <span class="field-label">Porting authorisation code (PAC)</span>
//                   <input type="text" placeholder="PAC e.g. ABC123456">
//                 </label>
//                 <label class="field">
//                   <span class="field-label">Port in date</span>
//                   <input type="text" placeholder="DD/MM/YYYY">
//                   <small>Your number will be transferred on the requested day and not before</small>
//                 </label>
//               </div>
//               <button class="primary-button disabled" type="button">Confirm mobile number</button>
//             </section>

//             <section class="checkout-card">
//               <div class="card-header">
//                 <h2>SIM type</h2>
//                 <p class="muted">Choose your preferred type of SIM</p>
//               </div>
//               <div class="option-list">
//                 <label class="option active">
//                   <input type="radio" name="sim-type" checked>
//                   <div class="option-body">
//                     <div class="option-title">eSIM</div>
//                     <small>Your Lyca Mobile SIM must be activated in the UK, once your SIM is activated in the UK, you can use it internationally according to your mobile plan.</small>
//                   </div>
//                 </label>
//                 <label class="option">
//                   <input type="radio" name="sim-type">
//                   <div class="option-body">
//                     <div class="option-title">SIM card</div>
//                   </div>
//                 </label>
//                 <a class="link-action" href="#">What's eSIM/Check compatibility</a>
//               </div>
//             </section>

//             <section class="checkout-card">
//               <div class="card-header">
//                 <h2>Review contract details</h2>
//                 <p class="muted">We have also sent these to</p>
//               </div>
//               <div class="download-list">
//                 <a class="download" href="#"><span class="icon-download"></span>Download contract information</a>
//                 <a class="download" href="#"><span class="icon-download"></span>Download contract summary</a>
//               </div>
//               <a class="link-action" href="#">View other formats</a>
//             </section>

//             <section class="checkout-card checkout-agreement">
//               <div class="card-header">
//                 <h2>Contract agreement</h2>
//               </div>
//               <label class="toggle">
//                 <input type="checkbox">
//                 <span>Please confirm that you're happy with the contract summary and information before you proceed. View full <a href="#">Terms and conditions</a></span>
//               </label>
//               <button class="primary-button disabled" type="button">Checkout now</button>
//             </section>
//           </div>

//     <aside class="checkout-sidebar">
//       <h2 class="summary-title">Order summary</h2>
//       <div class="summary-card pricing">
//         <div class="summary-row">
//           <div>
//             <div class="summary-label">Monthly cost</div>
//             ${
//               selection.subText
//                 ? `<div class="summary-note">${selection.subText}</div>`
//                 : ""
//             }
//           </div>
//           <div class="summary-price">${priceHtml}</div>
//         </div>
//         <div class="summary-divider"></div>
//         <ul class="summary-features">
//           ${featuresHtml}
//         </ul>
//       </div>

//       <div class="summary-card secure">
//         <div class="summary-label">Secure checkout</div>
//         <p class="muted"><a href="#">How to activate eSIM?</a></p>
//         <ul class="summary-notes">
//           <li>Spend cap is set to &pound;0.00. You can change this later on Lyca mobile app</li>
//           <li>Please note the cost of other services you take from us may increase or decrease while you are a Lyca customer.</li>
//         </ul>
//         <p class="muted">Need help? Find our <a href="#">FAQ</a> related to order checkout</p>
//       </div>
//     </aside>
//         </div>
//       </div>
//     </div>`;

//   main.innerHTML = "";
//   main.append(...wrapper.children);
// }
function buildCheckoutSteps() {
  const { steps, active } = getCheckoutStepsFromDoc();

  const el = document.createElement("div");
  el.className = "checkout-steps";

  steps.forEach((label, idx) => {
    const step = document.createElement("div");
    step.className = "step";

    const stepIndex = idx + 1;
    if (stepIndex === active) step.classList.add("active");
    else if (stepIndex === active + 1) step.classList.add("next");

    step.textContent = label;
    el.append(step);
  });

  const bar = document.createElement("div");
  bar.className = "step-progress";
  const span = document.createElement("span");
  bar.append(span);
  el.append(bar);

  return el;
}

function wrapCheckoutGroups(sectionEl) {
  const inner = sectionEl?.firstElementChild;
  if (!inner) return;

  const kids = [...inner.children];
  const starts = kids
    .map((n, i) => ({ n, i }))
    .filter(
      ({ n }) =>
        n.classList?.contains("default-content-wrapper") &&
        n.querySelector("h2,h3")
    )
    .map(({ i }) => i);

  if (!starts.length) return;

  const end = kids.length;
  starts.forEach((startIdx, idx) => {
    const endIdx = starts[idx + 1] ?? end;
    const card = document.createElement("div");
    card.className = "checkout-card";
    inner.insertBefore(card, kids[startIdx]);
    for (let i = startIdx; i < endIdx; i += 1) card.append(kids[i]);
  });
}

function parseCheckoutConfig(main) {
  const defaults = {
    titles: ["Mr", "Mrs", "Ms", "Miss", "Dr"],
    emailVerifyLabel: "Verify",
    numberOptions: ["I have a number to transfer", "No, I want a new number"],
    providers: ["Lyca Mobile", "Other service provider"],
    simTypes: ["eSIM (selected)", "SIM card"],
    links: [
      "What's eSIM/Check compatibility",
      "View other formats",
      "Terms and conditions",
      "FAQ",
    ],
    primaryCta: "Checkout now",
  };

  const table = [...main.querySelectorAll("table")].find((tbl) =>
    tbl.textContent.toLowerCase().includes("checkout form")
  );
  if (!table) return defaults;

  const rows = [...table.querySelectorAll("tr")].map((tr) => {
    const cells = [...tr.querySelectorAll("td,th")].map((c) =>
      c.textContent.trim()
    );
    return { label: cells[0] || "", value: cells[1] || "" };
  });

  const findRow = (key) =>
    rows.find((r) => r.label.toLowerCase().includes(key))?.value || "";
  const splitVals = (val) =>
    val
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);

  return {
    titles: splitVals(findRow("title options")) || defaults.titles,
    emailVerifyLabel:
      findRow("email verify label") || defaults.emailVerifyLabel,
    numberOptions:
      splitVals(findRow("number bring options")) || defaults.numberOptions,
    providers: splitVals(findRow("providers")) || defaults.providers,
    simTypes: splitVals(findRow("sim types")) || defaults.simTypes,
    links: splitVals(findRow("links")) || defaults.links,
    primaryCta: findRow("primary cta") || defaults.primaryCta,
  };
}

function buildLinkRow(links) {
  if (!links.length) return "";
  const [first, ...rest] = links;
  const others = rest
    .map((text) => `<a class="link-action" href="#">${text}</a>`)
    .join(" | ");
  return `<div class="form-links"><a class="link-action" href="#">${first}</a>${others ? ` | ${others}` : ""}</div>`;
}

export function decorateCheckoutLayout(main) {
  if (!document.body.classList.contains("paymonthly-checkout")) return;
  if (main.querySelector(".checkout-page")) return;

  const config = parseCheckoutConfig(main);
  const selection = getCheckoutSelection();
  const featureItems = (selection.features || []).filter(Boolean);
  const priceHtml = `${
    selection.oldPrice ? `<del>${selection.oldPrice}</del>` : ""
  } ${selection.newPrice ? `<strong>${selection.newPrice}</strong>` : ""}`.trim();

  const page = document.createElement("div");
  page.className = "checkout-page";
  page.innerHTML = `
    ${buildCheckoutSteps().outerHTML}
    <h1>My basket: Add-ons &amp; more</h1>
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
                ${config.titles.map((t) => `<option>${t}</option>`).join("")}
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
                <button class="ghost-button" type="button">${config.emailVerifyLabel}</button>
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
            <select aria-label="Number choice" id="number-choice">
              ${config.numberOptions
                .map(
                  (opt, idx) => `<option ${idx === 0 ? "selected" : ""}>${opt}</option>`
                )
                .join("")}
            </select>
          </label>
          <div class="pill-options provider-options">
            ${config.providers
              .map(
                (prov, idx) => `
            <label class="pill ${idx === 0 ? "active" : ""}">
              <input type="radio" name="provider" ${idx === 0 ? "checked" : ""}>
              <span>${prov}</span>
            </label>`
              )
              .join("")}
          </div>
          <div class="transfer-fields">
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
          </div>
        </section>

        <section class="checkout-card">
          <div class="card-header">
            <h2>SIM type</h2>
            <p class="muted">Choose your preferred type of SIM</p>
          </div>
          <div class="option-list">
            ${config.simTypes
              .map(
                (sim, idx) => `
            <label class="option ${sim.toLowerCase().includes("selected") || idx === 0 ? "active" : ""}">
              <input type="radio" name="sim-type" ${sim.toLowerCase().includes("selected") || idx === 0 ? "checked" : ""}>
              <div class="option-body">
                <div class="option-title">${sim.replace("(selected)", "").trim()}</div>
                <small class="sim-note ${idx === 0 ? "" : "hidden"}">
                  ${
                    idx === 0
                      ? "Your Lyca Mobile SIM must be activated in the UK, once your SIM is activated in the UK, you can use it internationally according to your mobile plan."
                      : "A SIM card will be sent to your delivery address."
                  }
                </small>
              </div>
            </label>`
              )
              .join("")}
            ${buildLinkRow(config.links)}
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
          <button class="primary-button disabled" type="button">${config.primaryCta}</button>
        </section>
      </div>

      <aside class="checkout-sidebar">
        <h2 class="summary-title">Order summary</h2>
        <div class="summary-card pricing">
          <div class="summary-row">
            <div>
              <div class="summary-label">Monthly cost</div>
              ${
                selection.subText
                  ? `<div class="summary-note">${selection.subText}</div>`
                  : ""
              }
            </div>
            <div class="summary-price">${priceHtml}</div>
          </div>
          <div class="summary-divider"></div>
          <ul class="summary-features">
            <li>${selection.title}</li>
            ${featureItems.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>

        <div class="summary-card secure">
          <div class="summary-label">Secure checkout</div>
          <p class="muted"><a href="https://www.lycamobile.co.uk/en/esim/how-do-i-activate-my-esim/">How to activate eSIM?</a></p>
          <ul class="summary-notes">
            <li>Spend cap is set to £0.00. You can change this later on Lyca mobile app</li>
            <li>Please note the cost of other services you take from us may increase or decrease while you are a Lyca customer.</li>
          </ul>
          <p class="muted">Need help? Find our <a href="https://www.lycamobile.co.uk/paymonthly/en/faq/">FAQ</a> related to order checkout</p>
        </div>
      </aside>
    </div>
  `;

  main.replaceChildren(page);

  // interactions
  const numberChoice = page.querySelector("#number-choice");
  const transferFields = page.querySelector(".transfer-fields");
  const providerPills = [...page.querySelectorAll(".provider-options .pill")];
  const simOptions = [...page.querySelectorAll(".option-list .option")];

  const toggleTransferFields = () => {
    const val = numberChoice?.value?.toLowerCase() || "";
    const show = val.includes("transfer");
    if (transferFields) transferFields.style.display = show ? "" : "none";
  };

  numberChoice?.addEventListener("change", toggleTransferFields);
  toggleTransferFields();

  providerPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      providerPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      const input = pill.querySelector("input");
      if (input) input.checked = true;
    });
  });

  simOptions.forEach((opt) => {
    opt.addEventListener("click", () => {
      simOptions.forEach((o) => {
        o.classList.remove("active");
        const radio = o.querySelector('input[type="radio"]');
        if (radio) radio.checked = false;
        const note = o.querySelector(".sim-note");
        if (note) note.classList.add("hidden");
      });
      opt.classList.add("active");
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      const note = opt.querySelector(".sim-note");
      if (note) note.classList.remove("hidden");
    });
  });
}

function getCheckoutStepsFromDoc() {
  const raw =
    getMetadata("checkout-steps") ||
    "Basket | Credit check | Delivery and payment";
  const steps = raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  const active = parseInt(getMetadata("checkout-step-active") || "1", 10);
  return { steps, active: Number.isNaN(active) ? 1 : active };
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = "en";
  const { pathname } = window.location;

  const template = getMetadata("template");
  if (template) document.body.classList.add(`paymonthly-${template}`);

  const isCheckoutNoChrome = pathname.includes("/paymonthly/en/checkout/checkout");
  const isCheckout = template === "checkout";
  if (isCheckout) document.body.classList.add("paymonthly-checkout");
  if (isCheckoutNoChrome) document.body.classList.add("checkout-hide-chrome");

  // eslint-disable-next-line no-unused-vars
  decorateTemplateAndTheme();
  const isConsentGiven = true;

  // Martech Plugin initialization
  const martechLoadedPromise = initMartech(
    // 1. WebSDK Configuration
    // Docs: https://experienceleague.adobe.com/en/docs/experience-platform/web-sdk/commands/configure/overview#configure-js
    {
      datastreamId: "c3040c2e-07d6-446c-8f3c-d3f500ff3113",
      orgId: "09CF60665F98CEF90A495FF8@AdobeOrg",
      defaultConsent: "in",
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
      personalization: !!getMetadata("target"),
      launchUrls: [
        "https://assets.adobedtm.com/0e9a0418089e/4efb62083c74/launch-7537c509f5f7-development.min.js",
      ],
      // See the API Reference for all available options.
    }
  );

  const main = doc.querySelector("main");
  if (main) {
    decorateMain(main);
    decorateCheckoutLayout(main);
    document.body.classList.add("appear");
    await Promise.all([
      martechLoadedPromise.then(martechEager),
      loadSection(main.querySelector(".section"), waitForFirstImage),
    ]);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem("fonts-loaded")) {
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
  loadHeader(doc.querySelector("header"));

  const main = doc.querySelector("main");
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector("footer"));

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
    import("./delayed.js");
  }, 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
