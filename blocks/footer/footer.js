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

  // Fragment has 2 divs: first with 5 columns content, second with bottom section
  const firstDiv = fragment.children[0];
  const secondDiv = fragment.children[1];

  if (firstDiv) {
    // Restructure first div to have each column (h2 + ul/p) in its own div
    const columnsContainer = document.createElement('div');
    const elements = Array.from(firstDiv.children);

    let currentColumn = null;
    elements.forEach((el) => {
      if (el.tagName === 'H2') {
        // Start new column
        if (currentColumn) columnsContainer.appendChild(currentColumn);
        currentColumn = document.createElement('div');
        currentColumn.appendChild(el);
      } else if (currentColumn) {
        // Add to current column
        currentColumn.appendChild(el);
      }
    });

    // Add last column
    if (currentColumn) columnsContainer.appendChild(currentColumn);

    footer.appendChild(columnsContainer);
  }

  // Add second div (logo, copyright, social) as-is
  if (secondDiv) {
    footer.appendChild(secondDiv);
  }

  block.append(footer);
}
