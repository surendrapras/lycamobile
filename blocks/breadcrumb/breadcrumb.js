const HOME_ICON = `
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M12 3 2 12h3v9h6v-6h2v6h6v-9h3L12 3z"/>
  </svg>
`;

const ROUTE_LABELS = [
  {
    match: /^\/paymonthly\/en\/bundles\/sim-only-deals\/paymonthly\/?$/i,
    label: 'Pay monthly SIM only deals',
  },
  {
    match: /^\/en\/bundles\/pay-as-you-go-sim-deals\/?$/i,
    label: 'Pay as you go sim deals',
  },
  {
    match: /^\/en\/help-support\/?$/i,
    label: 'Help & support',
  },
];

function getBreadcrumbLabel() {
  const path = window.location.pathname.replace(/\/$/, '');
  const mapped = ROUTE_LABELS.find((r) => r.match.test(path));
  if (mapped) return mapped.label;

  const h1 = document.querySelector('main h1');
  if (h1?.textContent?.trim()) return h1.textContent.trim();

  return document.title?.trim() || 'Home';
}

export default function decorate(block) {
  const label = getBreadcrumbLabel();

  block.textContent = '';

  const nav = document.createElement('nav');
  nav.className = 'breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');
  ol.className = 'breadcrumb-list';

  const liHome = document.createElement('li');
  liHome.className = 'breadcrumb-item';

  const homeLink = document.createElement('a');
  homeLink.href = '/';
  homeLink.className = 'breadcrumb-home';
  homeLink.setAttribute('aria-label', 'Home');
  homeLink.innerHTML = HOME_ICON;

  liHome.append(homeLink);

  const liSep = document.createElement('li');
  liSep.className = 'breadcrumb-sep';
  liSep.setAttribute('aria-hidden', 'true');

  const liCurrent = document.createElement('li');
  liCurrent.className = 'breadcrumb-item breadcrumb-current';
  liCurrent.setAttribute('aria-current', 'page');
  liCurrent.textContent = label;

  ol.append(liHome, liSep, liCurrent);
  nav.append(ol);
  block.append(nav);
}
