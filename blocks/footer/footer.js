/* eslint-disable */

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

  // Handle both 2-div and 3-div structures from Google Drive
  // 2-div: [sections, bottom] or 3-div: [sections, app-badges, bottom]
  const divCount = fragment.children.length;

  if (divCount === 3) {
    // 3-div structure: merge first two divs
    const firstDiv = fragment.children[0];
    const appBadgesDiv = fragment.children[1];
    const bottomDiv = fragment.children[2];

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

    // Add app badges to the last column (Lyca on the go)
    if (currentColumn && appBadgesDiv) {
      Array.from(appBadgesDiv.children).forEach((el) => {
        currentColumn.appendChild(el);
      });
    }

    // Add last column
    if (currentColumn) columnsContainer.appendChild(currentColumn);

    footer.appendChild(columnsContainer);

    // Add bottom div (logo, copyright, social) as-is
    if (bottomDiv) {
      footer.appendChild(bottomDiv);
    }
  } else {
    // 2-div structure: original logic
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
  }

  block.append(footer);
}
