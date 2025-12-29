import { createOptimizedPicture } from '../../scripts/aem.js';

const STORAGE_KEY = 'lyca.checkout.selectedPlan';

function readSelection() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : null;
  } catch (e) {
    return null;
  }
}

function getRowsText(block) {
  return [...block.children].map((row) => [...row.children].map((c) => (c.textContent || '').trim()));
}

function extractPrices(str) {
  const list = (str || '').match(/£\s*\d+(?:\.\d{2})?/g) || [];
  return { oldPrice: list[0] || '', newPrice: list[1] || list[0] || '' };
}

function renderSelectionRadio(block) {
  const rows = getRowsText(block).filter((r) => (r[0] || '').trim());
  const opts = rows.map((r) => (r[0] || '').trim()).filter(Boolean);
  if (!opts.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'option-list';

  const name = 'lyca-selection-radio';
  const defaultIdx = opts.findIndex((t) => /^no,/i.test(t));
  const activeIdx = defaultIdx >= 0 ? defaultIdx : 0;

  opts.forEach((t, idx) => {
    const label = document.createElement('label');
    label.className = 'option';
    if (idx === activeIdx) label.classList.add('active');

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.checked = idx === activeIdx;

    const body = document.createElement('div');

    const title = document.createElement('div');
    title.className = 'option-title';
    title.textContent = t;

    body.append(title);
    label.append(input, body);
    wrap.append(label);

    input.addEventListener('change', () => {
      [...wrap.querySelectorAll('.option')].forEach((n) => n.classList.remove('active'));
      label.classList.add('active');
    });
  });

  block.replaceChildren(wrap);
}

function renderSimType(block) {
  const rows = getRowsText(block).filter((r) => (r[0] || '').trim());
  const opts = rows.map((r) => ({
    label: (r[0] || '').trim(),
    selected: /selected/i.test((r[1] || '').trim()),
    note: (r[2] || '').trim(),
  })).filter((o) => o.label);

  if (!opts.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'option-list';

  const name = 'lyca-sim-type';
  const activeIdx = Math.max(0, opts.findIndex((o) => o.selected));

  opts.forEach((o, idx) => {
    const label = document.createElement('label');
    label.className = 'option';
    if (idx === activeIdx) label.classList.add('active');

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.checked = idx === activeIdx;

    const body = document.createElement('div');

    const title = document.createElement('div');
    title.className = 'option-title';
    title.textContent = o.label;

    const small = document.createElement('small');
    small.textContent = o.note || (o.label.toLowerCase().includes('esim')
      ? 'Your Lyca Mobile SIM must be activated in the UK...'
      : '');

    body.append(title);
    if (small.textContent) body.append(small);

    label.append(input, body);
    wrap.append(label);

    input.addEventListener('change', () => {
      [...wrap.querySelectorAll('.option')].forEach((n) => n.classList.remove('active'));
      label.classList.add('active');
    });
  });

  block.replaceChildren(wrap);
}

function renderPricingSummary(block) {
  const rows = getRowsText(block);
  const sel = readSelection();

  const leftLabel = (rows[0]?.[0] || 'Monthly cost').trim() || 'Monthly cost';
  const priceText = (rows[0]?.[1] || rows[1]?.[1] || '').trim();
  const subText = (rows[1]?.[1] || '').trim();

  const fromDoc = extractPrices(priceText);
  const oldPrice = sel?.oldPrice || fromDoc.oldPrice;
  const newPrice = sel?.newPrice || fromDoc.newPrice;
  const note = sel?.subText || subText;

  const card = document.createElement('div');
  card.className = 'summary-card';

  const row = document.createElement('div');
  row.className = 'summary-row';

  const l = document.createElement('div');
  const label = document.createElement('div');
  label.className = 'summary-label';
  label.textContent = leftLabel;

  const noteEl = document.createElement('div');
  noteEl.className = 'summary-note';
  noteEl.textContent = note || '';

  l.append(label);
  if (noteEl.textContent) l.append(noteEl);

  const price = document.createElement('div');
  price.className = 'summary-price';
  price.innerHTML = `${oldPrice ? `<del>${oldPrice}</del>` : ''} ${newPrice ? `<strong>${newPrice}</strong>` : ''}`.trim();

  row.append(l, price);
  card.append(row);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'link-action';
  remove.setAttribute('aria-label', 'Remove plan');
  remove.textContent = '🗑️';
  remove.style.marginTop = '8px';
  remove.style.alignSelf = 'flex-end';

  card.append(remove);
  block.replaceChildren(card);
}

function renderPlanFeatures(block) {
  const sel = readSelection();
  const rows = getRowsText(block).map((r) => (r[0] || '').trim()).filter(Boolean);

  const titleText =
    sel?.title ||
    (block.previousElementSibling?.textContent || '').trim() ||
    '24 month Unlimited';

  const features = Array.isArray(sel?.features) && sel.features.length ? sel.features : rows;

  const card = document.createElement('div');
  card.className = 'summary-card';

  const title = document.createElement('div');
  title.className = 'summary-label';
  title.textContent = titleText;

  const ul = document.createElement('ul');
  ul.className = 'summary-features';

  features.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    ul.append(li);
  });

  card.append(title, document.createElement('div'));
  card.lastChild.replaceWith(ul);

  block.replaceChildren(card);
}

function renderTrustBadges(block) {
  const rows = getRowsText(block).map((r) => ({
    title: (r[0] || '').trim(),
    desc: (r[1] || '').trim(),
  })).filter((r) => r.title || r.desc);

  const card = document.createElement('div');
  card.className = 'summary-card';

  const ul = document.createElement('ul');
  ul.className = 'summary-notes';

  rows.forEach((r) => {
    const li = document.createElement('li');
    li.textContent = r.desc ? `${r.title} ${r.desc}`.trim() : r.title;
    ul.append(li);
  });

  card.append(ul);
  block.replaceChildren(card);
}

export default function decorate(block) {
  // Checkout variants
  if (block.classList.contains('selection-radio')) {
    renderSelectionRadio(block);
    return;
  }
  if (block.classList.contains('sim-type')) {
    renderSimType(block);
    return;
  }
  if (block.classList.contains('pricing-summary')) {
    renderPricingSummary(block);
    return;
  }
  if (block.classList.contains('plan-features')) {
    renderPlanFeatures(block);
    return;
  }
  if (block.classList.contains('trust-badges')) {
    renderTrustBadges(block);
    return;
  }

  // Generic cards (existing behaviour)
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
    );
  });

  block.replaceChildren(ul);
}
