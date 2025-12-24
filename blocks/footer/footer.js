import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

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

  // Collect all content from fragment sections
  const allElements = [];
  [...fragment.querySelectorAll('.default-content-wrapper')].forEach((wrapper) => {
    allElements.push(...wrapper.children);
  });

  // Create columns container
  const columnsContainer = document.createElement('div');

  // Create bottom section container
  const bottomSection = document.createElement('div');
  const bottomWrapper = document.createElement('div');
  bottomWrapper.className = 'default-content-wrapper';

  let currentColumn = null;
  let isBottomSection = false;

  // Process all elements
  [...allElements].forEach((el) => {
    // Check if this is the bottom section (starts after "Lyca on the go" app badges)
    // Bottom section contains: logo (Lyca Mobile UK), copyright text, social icons
    const isLogo = el.tagName === 'P' && el.querySelector('img[alt="Lyca Mobile UK"]');
    const isCopyright = el.tagName === 'P' && el.textContent.includes('©');
    const isSocialIcons = el.tagName === 'P'
      && (el.querySelector('img[alt="Facebook"]')
        || el.querySelector('img[alt="Twitter"]')
        || el.querySelector('img[alt="Instagram"]'));

    if (isLogo || isCopyright || isSocialIcons) {
      isBottomSection = true;
    }

    if (isBottomSection) {
      // Add to bottom section
      bottomWrapper.appendChild(el.cloneNode(true));
    } else if (el.tagName === 'H2') {
      // Start new column
      if (currentColumn) columnsContainer.appendChild(currentColumn);
      currentColumn = document.createElement('div');
      currentColumn.appendChild(el.cloneNode(true));
    } else if (currentColumn) {
      // Add to current column
      currentColumn.appendChild(el.cloneNode(true));
    }
  });

  // Add last column
  if (currentColumn) columnsContainer.appendChild(currentColumn);

  // Add bottom wrapper to bottom section
  bottomSection.appendChild(bottomWrapper);

  // Build footer structure
  footer.appendChild(columnsContainer);
  footer.appendChild(bottomSection);

  block.append(footer);
}
