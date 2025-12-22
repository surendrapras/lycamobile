import { toClassName } from '../../scripts/aem.js';
function decorateLycaPhoneInput(block) {
  if (!block.closest('.lyca-section')) return;

  const triggerP = [...block.querySelectorAll('p')]
    .find((p) => p.textContent.trim().toLowerCase() === 'enter your mobile number');
  if (!triggerP) return;

  const uid = `lyca-phone-${Math.random().toString(16).slice(2)}`;

  const form = document.createElement('form');
  form.className = 'lyca-phone';
  form.setAttribute('novalidate', '');
  form.innerHTML = `
    <span class="lyca-phone-prefix" aria-hidden="true">+44</span>
    <label class="visually-hidden" for="${uid}">Enter your mobile number</label>
    <input
      id="${uid}"
      class="lyca-phone-input"
      type="tel"
      inputmode="tel"
      autocomplete="tel"
      placeholder="Enter lyca number &amp; get started"
    />
    <button class="lyca-phone-submit" type="submit" aria-label="Continue">
      <span aria-hidden="true">→</span>
    </button>
  `;

  form.addEventListener('submit', (e) => e.preventDefault());

  triggerP.replaceWith(form);
}

export default function decorate(block) {
  const rows = [...block.children].filter((r) => r.children && r.children.length);
  if (rows.length < 2) return;

  const tabsRow = rows[0];
  const tabCells = [...tabsRow.children];
  const panelRows = rows.slice(1);

  const tablist = document.createElement('div');
  tablist.className = 'tabs-account-list';
  tablist.setAttribute('role', 'tablist');

  const panelsWrap = document.createElement('div');
  panelsWrap.className = 'tabs-account-panels';

  const tabs = tabCells.map((cell, i) => {
    const link = cell.querySelector('a');
    const label = (link ? link.textContent : cell.textContent).trim() || `Tab ${i + 1}`;
    const id = toClassName(label) || `tab-${i + 1}`;

    const tab = document.createElement('a');
    tab.className = 'tabs-account-tab';
    tab.id = `tab-${id}`;
    tab.href = '#';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tab.setAttribute('tabindex', i === 0 ? '0' : '-1');
    tab.textContent = label;

    if (link && link.href) tab.dataset.href = link.href;

    tablist.append(tab);
    return tab;
  });

  const panels = tabs.map((tab, i) => {
    const panel = document.createElement('div');
    panel.className = 'tabs-account-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    if (i !== 0) panel.hidden = true;

    const row = panelRows[i];
    const firstCell = row ? row.children[0] : null;

    if (firstCell) {
      while (firstCell.firstChild) panel.append(firstCell.firstChild);
    }

    panelsWrap.append(panel);
    return panel;
  });

  block.innerHTML = '';
  block.append(tablist, panelsWrap);

  const activate = (index, focus = true) => {
    tabs.forEach((t, i) => {
      const selected = i === index;
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
      t.setAttribute('tabindex', selected ? '0' : '-1');
      panels[i].hidden = !selected;
    });
    if (focus) tabs[index].focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      activate(i, false);
    });

    tab.addEventListener('keydown', (e) => {
      const current = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
      let next = current;

      if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;

      if (next !== current) {
        e.preventDefault();
        activate(next, true);
      }
    });
  });

  decorateLycaPhoneInput(block);
}

