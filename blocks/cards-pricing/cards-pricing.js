import { createOptimizedPicture } from '../../scripts/aem.js';

const ICONS = ['eSIM', '5G'];

function getText(el) {
  return (el?.textContent || '').trim();
}

function isPromoLine(text) {
  return /half price|voucher|offer/i.test(text) && text.length <= 40;
}

function extractCtas(container) {
  const links = [...container.querySelectorAll('a')];

  const viewMore = links.find((a) => /view more/i.test(getText(a))) || null;
  const buyNow = links.find((a) => /buy now/i.test(getText(a))) || null;

  // If authoring doesn't have link texts, fallback to last two anchors
  const fallback = links.slice(-2);
  const view = viewMore || fallback[0] || null;
  const buy = buyNow || fallback[1] || null;

  if (view) view.remove();
  if (buy) buy.remove();

  return { view, buy };
}

function parsePriceFromParagraph(p) {
  const text = getText(p);
  const prices = text.match(/£\s*\d+(?:\.\d{1,2})?/g) || [];
  const monthly = /monthly/i.test(text) ? 'monthly' : '';

  // If authoring is like: "<del> £9.00 monthly£18.00"
  // we assume prices[0] is new, prices[1] is old.
  let newPrice = prices[0] || '';
  let oldPrice = prices[1] || '';

  // If authoring is like: "<del> £18.00</del> £9.00 monthly"
  // we can detect that by checking if the string starts with "<del>" (often in HTML),
  // but after import we can’t reliably read raw HTML — so we use a safer heuristic:
  // if the 2nd price is bigger, treat it as old; else keep as is.
  if (prices.length >= 2) {
    const n1 = parseFloat(prices[0].replace(/[£\s]/g, ''));
    const n2 = parseFloat(prices[1].replace(/[£\s]/g, ''));
    if (!Number.isNaN(n1) && !Number.isNaN(n2) && n2 > n1) {
      newPrice = prices[0];
      oldPrice = prices[1];
    } else {
      // if authored already in correct order, it will still work visually
      // (worst case: both are shown, but still formatted)
      oldPrice = prices[0];
      newPrice = prices[1];
    }
  }

  return { oldPrice, newPrice, monthly };
}

function buildPriceEl(priceP) {
  const { oldPrice, newPrice, monthly } = parsePriceFromParagraph(priceP);

  const price = document.createElement('p');
  price.className = 'cards-pricing-price';

  if (oldPrice) {
    const del = document.createElement('del');
    del.textContent = oldPrice;
    price.append(del);
  }

  if (newPrice) {
    const strong = document.createElement('strong');
    strong.textContent = newPrice;
    price.append(strong);
  }

  if (monthly) {
    const span = document.createElement('span');
    span.className = 'cards-pricing-period';
    span.textContent = monthly;
    price.append(span);
  }

  return price;
}

function buildDataEl(dataP) {
  const dataText = getText(dataP);
  const value = dataText.replace(/data$/i, '').trim() || dataText;

  const wrap = document.createElement('div');
  wrap.className = 'cards-pricing-data';

  const val = document.createElement('div');
  val.className = 'cards-pricing-data-value';
  val.textContent = value;

  const lbl = document.createElement('div');
  lbl.className = 'cards-pricing-data-label';
  lbl.textContent = 'Data';

  wrap.append(val, lbl);
  return wrap;
}

function buildFeaturesEl(featurePs) {
  const ul = document.createElement('ul');
  ul.className = 'cards-pricing-features';

  featurePs.forEach((p) => {
    const li = document.createElement('li');
    li.textContent = getText(p);
    ul.append(li);
  });

  return ul;
}

function buildActionsEl(ctas) {
  const wrap = document.createElement('div');
  wrap.className = 'cards-pricing-actions';

  const icons = document.createElement('div');
  icons.className = 'cards-pricing-icons';

  ICONS.forEach((label) => {
    const s = document.createElement('span');
    s.className = 'cards-pricing-icon';
    s.textContent = label;
    icons.append(s);
  });

  const ctaWrap = document.createElement('div');
  ctaWrap.className = 'cards-pricing-ctas';

  if (ctas.view) {
    ctas.view.classList.add('cards-pricing-viewmore');
    ctaWrap.append(ctas.view);
  }

  if (ctas.buy) {
    ctas.buy.classList.add('cards-pricing-buynow');
    ctaWrap.append(ctas.buy);
  }

  wrap.append(icons, ctaWrap);
  return wrap;
}

export default function decorate(block) {
  // contract duration class -> view-list
  const durationMatch = block.className.match(/contract-duration-(\d+)/i);
  if (durationMatch) {
    [, block.dataset.contractDuration] = durationMatch;
  }

  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    const titleCell = cells[0];
    const detailCell = cells[1] || cells[0];

    const allPs = [...detailCell.querySelectorAll('p')].filter((p) => getText(p));
    const used = new Set();

    // Promo
    let promoText = '';
    if (allPs[0] && isPromoLine(getText(allPs[0])) && !allPs[0].querySelector('a')) {
      promoText = getText(allPs[0]);
      used.add(allPs[0]);
    }

    // Title (prefer col-1 text)
    let titleText = getText(titleCell);
    let titleP = null;

    if (!titleText) {
      titleP = allPs.find((p) => !used.has(p) && /month/i.test(getText(p)) && !/^for the first/i.test(getText(p)));
      if (titleP) {
        titleText = getText(titleP).split('£')[0].trim();
        // If title paragraph also contains prices, keep it for price parsing
        if (!/£/.test(getText(titleP))) used.add(titleP);
      }
    }

    // CTAs (View more / Buy now)
    const ctas = extractCtas(detailCell);

    // Price paragraph
    let priceP = allPs.find((p) => /£/.test(getText(p)) && /monthly/i.test(getText(p)) && !used.has(p))
      || allPs.find((p) => /£/.test(getText(p)) && !used.has(p))
      || null;

    if (!priceP && titleP && /£/.test(getText(titleP))) priceP = titleP;
    if (priceP) used.add(priceP);

    // Subtext (for the first...)
    const subP = allPs.find((p) => !used.has(p) && /^for the first/i.test(getText(p))) || null;
    if (subP) used.add(subP);

    // Data paragraph (ends with Data)
    const dataP = allPs.find((p) => !used.has(p) && /data$/i.test(getText(p))) || null;
    if (dataP) used.add(dataP);

    // Features = remaining non-empty, non-link paragraphs (usually 3)
    const featurePs = allPs
      .filter((p) => !used.has(p) && !p.querySelector('a'))
      .slice(0, 3);

    const li = document.createElement('li');
    li.className = 'cards-pricing-item';

    if (promoText) {
      const badge = document.createElement('div');
      badge.className = 'cards-pricing-promo';
      badge.textContent = promoText;
      li.append(badge);
    }

    // Left panel
    const left = document.createElement('div');
    left.className = 'cards-pricing-left';

    if (titleText) {
      const title = document.createElement('p');
      title.className = 'cards-pricing-title';
      title.textContent = titleText;
      left.append(title);
    }

    if (priceP) left.append(buildPriceEl(priceP));

    if (subP) {
      const sub = document.createElement('p');
      sub.className = 'cards-pricing-subtext';
      sub.textContent = getText(subP);
      left.append(sub);
    }

    // Data panel
    const data = dataP ? buildDataEl(dataP) : document.createElement('div');
    if (!dataP) data.className = 'cards-pricing-data';

    // Features
    const feats = buildFeaturesEl(featurePs);

    // Actions
    const actions = buildActionsEl(ctas);

    li.append(left, data, feats, actions);

    // Optimize any images inside card
    li.querySelectorAll('picture > img').forEach((img) => {
      img.closest('picture').replaceWith(
        createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
      );
    });

    ul.append(li);
  });

  block.replaceChildren(ul);
}
