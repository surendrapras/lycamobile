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

function applyPricingSummary(block, sel) {
  const oldPrice = sel?.oldPrice || '';
  const newPrice = sel?.newPrice || '';
  const subText = sel?.subText || '';

  const paras = [...block.querySelectorAll('.cards-card-body p')];

  const priceP = paras.find((p) => /£\s*\d/.test(p.textContent || '') && !/for the first/i.test(p.textContent || ''));
  if (priceP && (oldPrice || newPrice)) {
    const parts = [];
    if (oldPrice) parts.push(`<del>${oldPrice}</del>`);
    if (newPrice) parts.push(`<strong>${newPrice}</strong>`);
    priceP.innerHTML = parts.join(' ');
  }

  const subP = paras.find((p) => /for the first/i.test(p.textContent || ''));
  if (subP && subText) subP.textContent = subText;
}

function applyPlanFeatures(block, sel) {
  const features = Array.isArray(sel?.features) ? sel.features.filter(Boolean) : [];
  const title = sel?.title || '';

  if (title) {
    const prev = block.previousElementSibling;
    if (prev && (prev.tagName === 'P' || /^H[1-6]$/.test(prev.tagName))) {
      prev.textContent = title;
    }
  }

  if (!features.length) return;

  const ul = block.querySelector('ul');
  if (!ul) return;

  ul.replaceChildren();

  features.forEach((t) => {
    const li = document.createElement('li');

    const body = document.createElement('div');
    body.className = 'cards-card-body';

    const p = document.createElement('p');
    p.textContent = t;

    body.append(p);
    li.append(body);
    ul.append(li);
  });
}

export default function decorate(block) {
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

  const sel = readSelection();
  if (!sel) return;

  if (block.classList.contains('pricing-summary')) applyPricingSummary(block, sel);
  if (block.classList.contains('plan-features')) applyPlanFeatures(block, sel);
}
