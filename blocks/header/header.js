import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

let closeOnEscape;
let closeOnFocusLost;

function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  });
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused?.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

function applyMenuState(nav, navSections, nextOpen) {
  const button = nav.querySelector('.nav-hamburger button');

  document.body.style.overflowY = (nextOpen && !isDesktop.matches) ? 'hidden' : '';
  nav.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');

  toggleAllNavSections(navSections, nextOpen && !isDesktop.matches);

  button.setAttribute('aria-label', nextOpen ? 'Close navigation' : 'Open navigation');

  const navDrops = navSections?.querySelectorAll('.nav-drop') || [];
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  if (nextOpen || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const currentOpen = nav.getAttribute('aria-expanded') === 'true';
  const nextOpen = forceExpanded === null ? !currentOpen : forceExpanded;
  applyMenuState(nav, navSections, nextOpen);
}

closeOnEscape = (e) => {
  if (e.code !== 'Escape') return;

  const nav = document.getElementById('nav');
  if (!nav) return;

  const navSections = nav.querySelector('.nav-sections');
  const navSectionExpanded = navSections?.querySelector('[aria-expanded=\'true\']');

  if (navSectionExpanded && isDesktop.matches) {
    toggleAllNavSections(navSections);
    navSectionExpanded.focus();
    return;
  }

  if (!isDesktop.matches) {
    toggleMenu(nav, navSections, false);
    nav.querySelector('button')?.focus();
  }
};

closeOnFocusLost = (e) => {
  const nav = e.currentTarget;
  if (nav.contains(e.relatedTarget)) return;

  const navSections = nav.querySelector('.nav-sections');
  const navSectionExpanded = navSections?.querySelector('[aria-expanded=\'true\']');

  if (navSectionExpanded && isDesktop.matches) {
    toggleAllNavSections(navSections, false);
    return;
  }

  if (!isDesktop.matches) {
    toggleMenu(nav, navSections, false);
  }
};

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';

  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  if (nav.children.length === 0) {
    nav.innerHTML = `
      <div>
        <p><strong><a href="/">Lyca Mobile UK</a></strong></p>
      </div>
      <div>
        <ul>
          <li><a href="/paymonthly/en/bundles/sim-only-deals/paymonthly">Pay monthly</a></li>
          <li><a href="/en/bundles/pay-as-you-go-sim-deals/">SIM only deals</a></li>
          <li><a href="/en/help-support">Help</a></li>
          <li><a href="/en/refer-a-friend">Refer a friend</a></li>
        </ul>
      </div>
      <div>
        <ul>
          <li><a href="/en/quick-top-up">Quick top up</a></li>
          <li><a href="https://mylyca.lycamobile.co.uk/en/login">Login</a></li>
          <li><a href="/en/cart">Cart</a></li>
        </ul>
      </div>
    `;
  }

  ['brand', 'sections', 'tools'].forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand?.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container')?.classList.remove('button-container');
  }

  const brandImg = navBrand?.querySelector('img');
  const brandAnchor = navBrand?.querySelector('a');
  if (brandAnchor) {
    brandAnchor.href = '/';
  } else if (brandImg) {
    const anchor = document.createElement('a');
    anchor.href = '/';
    const picture = brandImg.closest('picture');
    const target = picture || brandImg;
    target.replaceWith(anchor);
    anchor.appendChild(target);
  }

  const navTools = nav.querySelector('.nav-tools');
  const toolsUl = navTools?.querySelector('ul');

  if (toolsUl) {
    [...toolsUl.children].forEach((li) => {
      const a = li.querySelector('a');
      if (!a) return;

      const text = a.textContent.trim().toLowerCase();

      if (text === 'quick top up' || text === 'recharge éclair') {
        li.classList.add('nav-tools-cta');
      }

      if (text === 'login') {
        li.classList.add('nav-tools-account');
        a.setAttribute('aria-label', 'Account');
        a.innerHTML = '<span class="nav-tools-icon-circle"><img src="https://www.lycamobile.co.uk/_next/static/media/Account.ec46a854.svg" alt="" loading="lazy"></span><span class="nav-tools-chevron" aria-hidden="true"></span>';
      }

      if (text === 'cart') {
        li.classList.add('nav-tools-cart');
        a.setAttribute('aria-label', 'Cart');
        a.innerHTML = '<span class="nav-tools-icon-circle"><img src="https://www.lycamobile.co.uk/_next/static/media/Cart.c7614522.svg" alt="" loading="lazy"></span>';
      }
    });

    if (!toolsUl.querySelector('.nav-tools-lang')) {
      const li = document.createElement('li');
      li.className = 'nav-tools-lang';

      // Detect current language from URL path
      const path = window.location.pathname;
      const isFrench = path.startsWith('/fr/') || path === '/fr';
      const langCode = isFrench ? 'FR' : 'EN';
      const flagImg = isFrench
        ? 'https://www.lycamobile.fr/_next/static/media/flagFR.3a498eed.svg'
        : 'https://www.lycamobile.co.uk/_next/static/media/flagUK.a0f55c8d.svg';
      const switchUrl = isFrench ? '/en/' : '/fr/';

      const a = document.createElement('a');
      a.href = switchUrl;
      a.setAttribute('aria-label', 'Language');
      a.innerHTML = `<span class="nav-tools-lang-code">${langCode}</span><img class="nav-tools-flag" src="${flagImg}" alt="flag" loading="lazy">`;

      li.appendChild(a);
      toolsUl.appendChild(li);
    }
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = '<button type="button" aria-controls="nav" aria-label="Open navigation"><span class="nav-hamburger-icon"></span></button>';
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);

  nav.setAttribute('aria-expanded', 'false');
  toggleMenu(nav, navSections, false);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, false));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
