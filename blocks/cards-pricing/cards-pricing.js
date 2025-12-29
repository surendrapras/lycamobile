import { createOptimizedPicture } from '../../scripts/aem.js';

const ICONS = ['eSIM', '5G'];
const STORAGE_KEY = 'lyca.checkout.selectedPlan';

function txt(node) {
  return (node && node.textContent ? node.textContent : '').trim();
}

function norm(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function isPromo(s) {
  const t = norm(s).toLowerCase();
  return (t.includes('half price') || t.includes('voucher') || t.includes('offer')) && t.length <= 50;
}

function isSubtext(s) {
  return /^for the first/i.test(norm(s));
}

function isDataLine(s) {
  return /\bdata\b$/i.test(norm(s));
}

function isCtaLine(s) {
  const t = norm(s).toLowerCase();
  return t.includes('view more') || t.includes('buy now');
}

function isTitleLine(s) {
  const t = norm(s);
  return /month/i.test(t) && !/£/.test(t) && !isSubtext(t) && !isPromo(t) && !isCtaLine(t);
}

function splitTitleAndPrice(s) {
  const raw = norm(s);
  const cut = raw.split('£')[0];
  return norm(cut.replace(/<\s*del\s*>/gi, '').replace(/<\s*\/\s*del\s*>/gi, ''));
}

function parsePrice(s) {
  const text = norm(s);
  const prices = text.match(/£\s*\d+(?:\.\d{1,2})?/g) || [];

  let newPrice = prices[0] || '';
  let oldPrice = prices[1] || '';

  if (prices.length >= 2) {
    const n1 = parseFloat(prices[0].replace(/[£\s]/g, ''));
    const n2 = parseFloat(prices[1].replace(/[£\s]/g, ''));
    if (!Number.isNaN(n1) && !Number.isNaN(n2) && n2 > n1) {
      [newPrice, oldPrice] = prices;
    } else {
      [oldPrice, newPrice] = prices;
    }
  }

  const monthly = /monthly/i.test(text) ? 'monthly' : '';
  return { oldPrice: norm(oldPrice), newPrice: norm(newPrice), monthly };
}

function setSelection(data) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    /* noop */
  }
}

function buildPriceEl(priceText) {
  const { oldPrice, newPrice, monthly } = parsePrice(priceText);
  const p = document.createElement('p');
  p.className = 'cards-pricing-price';

  if (oldPrice) {
    const d = document.createElement('del');
    d.textContent = oldPrice;
    p.append(d);
  }

  if (newPrice) {
    const s = document.createElement('strong');
    s.textContent = newPrice;
    p.append(s);
  }

  if (monthly) {
    const span = document.createElement('span');
    span.className = 'cards-pricing-period';
    span.textContent = monthly;
    p.append(span);
  }

  return p;
}

function buildDataEl(dataText) {
  const value = norm(dataText).replace(/data$/i, '').trim() || norm(dataText);
  const wrap = document.createElement('div');
  wrap.className = 'cards-pricing-data';

  const v = document.createElement('div');
  v.className = 'cards-pricing-data-value';
  v.textContent = value;

  const l = document.createElement('div');
  l.className = 'cards-pricing-data-label';
  l.textContent = 'Data';

  wrap.append(v, l);
  return wrap;
}

function buildFeaturesEl(items) {
  const ul = document.createElement('ul');
  ul.className = 'cards-pricing-features';
  items.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    ul.append(li);
  });
  return ul;
}

function buildActionsEl(viewLink, buyLink, selection) {
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

  const ctas = document.createElement('div');
  ctas.className = 'cards-pricing-ctas';

  if (viewLink) {
    viewLink.classList.add('cards-pricing-viewmore');
    ctas.append(viewLink);
  }

  if (buyLink) {
    buyLink.classList.add('cards-pricing-buynow');

    const href = buyLink.getAttribute('href') || '';
    if (!href || href === '#') buyLink.setAttribute('href', '/paymonthly/en/checkout/checkout');

    buyLink.addEventListener('click', () => {
      if (selection) setSelection(selection);
    });

    ctas.append(buyLink);
  }

  wrap.append(icons, ctas);
  return wrap;
}

function pickLinks(row) {
  const links = [...row.querySelectorAll('a')];
  const view = links.find((a) => /view more/i.test(txt(a))) || null;
  const buy = links.find((a) => /buy now/i.test(txt(a))) || null;

  if (view || buy) return { view, buy };

  const p = [...row.querySelectorAll('p')].find((x) => isCtaLine(txt(x)));
  const t = p ? norm(txt(p)).toLowerCase() : '';

  const mk = (label) => {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = label;
    return a;
  };

  return {
    view: t.includes('view more') ? mk('View more') : null,
    buy: t.includes('buy now') ? mk('Buy now') : null,
  };
}

export default function decorate(block) {
  const durationMatch = block.className.match(/contract-duration-(\d+)/i);
  if (durationMatch) {
    [, block.dataset.contractDuration] = durationMatch;
  }

  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const pTexts = [...row.querySelectorAll('p')].map((p) => norm(txt(p))).filter(Boolean);
    const liTexts = [...row.querySelectorAll('ul li, ol li')].map((li) => norm(txt(li))).filter(Boolean);

    const promoText = pTexts.find((t) => isPromo(t)) || '';

    const titleCandidate = pTexts.find((t) => isTitleLine(t))
      || pTexts.find((t) => /month/i.test(t) && !isSubtext(t) && !isPromo(t) && !isCtaLine(t))
      || '';

    const titleText = titleCandidate ? splitTitleAndPrice(titleCandidate) : '';

    let priceText = pTexts.find((t) => /£/.test(t) && /monthly/i.test(t)) || '';
    if (!priceText && /£/.test(titleCandidate)) priceText = titleCandidate;

    const subText = pTexts.find((t) => isSubtext(t)) || '';
    const dataText = pTexts.find((t) => isDataLine(t)) || '';

    let featureItems = [];
    if (liTexts.length) {
      featureItems = liTexts;
    } else {
      featureItems = pTexts
        .filter((t) => !isPromo(t))
        .filter((t) => !isSubtext(t))
        .filter((t) => !isDataLine(t))
        .filter((t) => !/£/.test(t))
        .filter((t) => !isCtaLine(t))
        .map((t) => t.replace(/^●\s*/, '').trim())
        .filter(Boolean);
    }

    featureItems = featureItems
      .map((t) => t.replace(/^●\s*/, '').trim())
      .filter((t) => t && !isCtaLine(t));

    const { view, buy } = pickLinks(row);

    const { oldPrice, newPrice } = parsePrice(priceText);

    const selection = {
      title: titleText,
      oldPrice,
      newPrice,
      subText,
      features: featureItems,
      contractDuration: block.dataset.contractDuration || '',
    };

    const li = document.createElement('li');
    li.className = 'cards-pricing-item';

    if (promoText) {
      const badge = document.createElement('div');
      badge.className = 'cards-pricing-promo';
      badge.textContent = promoText;
      li.append(badge);
    }

    const left = document.createElement('div');
    left.className = 'cards-pricing-left';

    if (titleText) {
      const t = document.createElement('p');
      t.className = 'cards-pricing-title';
      t.textContent = titleText;
      left.append(t);
    }

    if (priceText) left.append(buildPriceEl(priceText));

    if (subText) {
      const s = document.createElement('p');
      s.className = 'cards-pricing-subtext';
      s.textContent = subText;
      left.append(s);
    }

    const data = dataText ? buildDataEl(dataText) : (() => {
      const d = document.createElement('div');
      d.className = 'cards-pricing-data';
      return d;
    })();

    const feats = buildFeaturesEl(featureItems.slice(0, 4));
    const actions = buildActionsEl(view, buy, selection);

    li.append(left, data, feats, actions);

    li.querySelectorAll('picture > img').forEach((img) => {
      const pic = img.closest('picture');
      if (pic) pic.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
    });

    ul.append(li);
  });

  block.replaceChildren(ul);
}
