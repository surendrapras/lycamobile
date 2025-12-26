import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function buildColumns(section, appBadgesSection) {
  if (!section) return null;
  const wrapper = section.querySelector('.default-content-wrapper, :scope > div');
  if (!wrapper) return null;

  const columnsContainer = document.createElement('div');
  columnsContainer.className = 'footer-columns';
  const elements = Array.from(wrapper.children);

  let currentColumn = null;
  elements.forEach((el) => {
    if (el.tagName === 'H2') {
      if (currentColumn) columnsContainer.appendChild(currentColumn);
      currentColumn = document.createElement('div');
      currentColumn.className = 'footer-column';
      currentColumn.appendChild(el);
      return;
    }
    if (currentColumn) currentColumn.appendChild(el);
  });

  if (currentColumn) columnsContainer.appendChild(currentColumn);

  if (appBadgesSection) {
    const appBadgesWrapper = appBadgesSection.querySelector('.default-content-wrapper, :scope > div');
    let lastColumn = columnsContainer.lastElementChild;
    if (!lastColumn) {
      lastColumn = document.createElement('div');
      lastColumn.className = 'footer-column';
      columnsContainer.appendChild(lastColumn);
    }
    if (appBadgesWrapper && lastColumn) {
      lastColumn.classList.add('footer-apps');
      Array.from(appBadgesWrapper.children).forEach((el) => {
        lastColumn.appendChild(el);
      });
    }
  }

  const lastColumn = columnsContainer.lastElementChild;
  if (lastColumn && lastColumn.querySelector('picture, img')) {
    lastColumn.classList.add('footer-apps');
  }

  return columnsContainer;
}

function decorateBottomSection(section) {
  if (!section) return;
  section.classList.add('footer-bottom');
  const wrapper = section.querySelector('.default-content-wrapper, :scope > div');
  if (!wrapper) return;
  wrapper.classList.add('footer-bottom-content');

  const paragraphs = Array.from(wrapper.querySelectorAll(':scope > p'));
  if (paragraphs[0]) paragraphs[0].classList.add('footer-logo');
  if (paragraphs[1]) paragraphs[1].classList.add('footer-copy');
  if (paragraphs[2]) paragraphs[2].classList.add('footer-social');
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  if (!fragment) {
    block.append(footer);
    return;
  }

  const sections = Array.from(fragment.children)
    .filter((section) => !section.querySelector('.lyca-snow'));

  // Handle both 2-div and 3-div structures from Google Drive
  // 2-div: [sections, bottom] or 3-div: [sections, app-badges, bottom]
  const divCount = sections.length;
  const firstSection = sections[0];
  const appBadgesSection = divCount === 3 ? sections[1] : null;
  const bottomSection = sections[divCount - 1];

  const columnsContainer = buildColumns(firstSection, appBadgesSection);
  if (columnsContainer) footer.appendChild(columnsContainer);

  if (bottomSection) {
    decorateBottomSection(bottomSection);
    footer.appendChild(bottomSection);
  }

  block.append(footer);
}
