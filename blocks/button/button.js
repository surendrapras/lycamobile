function cleanText(str) {
  return (str || '').replace(/\{[^}]+\}/g, '').trim();
}

function setDisabled(btn, disabled) {
  btn.disabled = !!disabled;
  btn.classList.toggle('disabled', !!disabled);
}

export default function decorate(block) {
  const label = cleanText(block.textContent || 'Checkout now');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'primary-button';
  btn.textContent = label;

  // default disabled (matches design)
  setDisabled(btn, true);

  // enable when consent toggle checked
  const section = block.closest('.section') || document;
  const toggle = section.querySelector('input[data-consent-toggle="true"]');

  if (toggle) {
    const sync = () => setDisabled(btn, !toggle.checked);
    toggle.addEventListener('change', sync);
    sync();
  }

  block.replaceChildren(btn);
}
