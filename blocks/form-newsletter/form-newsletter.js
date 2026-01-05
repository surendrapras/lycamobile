let newsletterId = 0;

function normalize(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function cleanBracketText(text) {
  return normalize(text).replace(/^\[/, '').replace(/\]$/, '').trim();
}

function collectLines(block) {
  // Works for both default-content-wrapper and block-table rendering
  const lines = [];

  // collect headings if present
  const heading = block.querySelector('h1, h2, h3');
  if (heading) lines.push(normalize(heading.textContent));

  // collect paragraph lines
  block.querySelectorAll('p').forEach((p) => {
    const t = normalize(p.textContent);
    if (t) lines.push(t);
  });

  // de-dupe while keeping order
  return lines.filter((t, i) => t && lines.indexOf(t) === i);
}

function pickParts(lines) {
  const headingText = lines.find((t) => t.length > 0) || 'Sign up to get exclusive offers';

  const placeholderIdx = lines.findIndex((t) => /email/i.test(t));
  const placeholderText = placeholderIdx >= 0 ? lines[placeholderIdx] : 'Enter your email address';

  const ctaIdx = lines.findIndex((t) => /^\[.*\]$/.test(t) || /join\s+our\s+offers\s+club/i.test(t));
  const ctaRaw = ctaIdx >= 0 ? lines[ctaIdx] : 'JOIN OUR OFFERS CLUB';
  const ctaText = cleanBracketText(ctaRaw) || 'JOIN OUR OFFERS CLUB';

  const descText = lines
    .filter((t, i) => i !== ctaIdx && i !== placeholderIdx && t !== headingText)
    .join(' ');

  return {
    headingText,
    placeholderText,
    ctaText,
    descText,
  };
}

export default function decorate(block) {
  const lines = collectLines(block);
  const {
    headingText,
    placeholderText,
    ctaText,
    descText,
  } = pickParts(lines);

  newsletterId += 1;
  const inputId = `newsletter-email-${newsletterId}`;

  block.textContent = '';

  const root = document.createElement('div');
  root.className = 'form-newsletter-root';

  const headingWrap = document.createElement('div');
  headingWrap.className = 'form-newsletter-heading';
  headingWrap.innerHTML = `<h2><span>${headingText}</span></h2>`;

  const main = document.createElement('div');
  main.className = 'form-newsletter-main';

  const form = document.createElement('form');
  form.className = 'form-newsletter-form';
  form.noValidate = true;

  const label = document.createElement('label');
  label.className = 'form-newsletter-visually-hidden';
  label.setAttribute('for', inputId);
  label.textContent = placeholderText;

  const input = document.createElement('input');
  input.className = 'form-newsletter-input';
  input.id = inputId;
  input.name = 'email';
  input.type = 'email';
  input.placeholder = placeholderText; // Fix: Use the parsed placeholder text
  input.autocomplete = 'email';
  input.inputMode = 'email';

  // Apply specific styling for French newsletter if detected
  if (headingText.includes('Inscrivez-vous')) {
    block.closest('.section').classList.add('french-newsletter');
  }
  input.required = true;

  const btn = document.createElement('button');
  btn.className = 'form-newsletter-button';
  btn.type = 'submit';
  btn.textContent = ctaText;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    input.reportValidity();
  });

  const desc = document.createElement('div');
  desc.className = 'form-newsletter-description';
  desc.innerHTML = descText ? `<p><span>${descText}</span></p>` : '';

  form.append(label, input, btn);
  main.append(form, desc);
  root.append(headingWrap, main);
  block.append(root);
}
