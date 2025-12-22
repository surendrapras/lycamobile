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
    const firstSection = fragment.children[0];
    const appBadgesSection = fragment.children[1];
    const bottomSection = fragment.children[2];

    // Get the wrapper div inside the section (added by decorateSections)
    const firstWrapper = firstSection.querySelector('.default-content-wrapper, :scope > div');
    const appBadgesWrapper = appBadgesSection.querySelector('.default-content-wrapper, :scope > div');

    // Restructure first div to have each column (h2 + ul/p) in its own div
    const columnsContainer = document.createElement('div');
    const elements = firstWrapper ? Array.from(firstWrapper.children) : [];

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
    if (currentColumn && appBadgesWrapper) {
      Array.from(appBadgesWrapper.children).forEach((el) => {
        currentColumn.appendChild(el);
      });
    }

    // Add last column
    if (currentColumn) columnsContainer.appendChild(currentColumn);

    footer.appendChild(columnsContainer);

    // Add bottom div (logo, copyright, social) as-is
    if (bottomSection) {
      footer.appendChild(bottomSection);
    }
  } else {
    // 2-div structure: original logic
    const firstSection = fragment.children[0];
    const secondSection = fragment.children[1];

    if (firstSection) {
      // Get the wrapper div inside the section (added by decorateSections)
      const firstWrapper = firstSection.querySelector('.default-content-wrapper, :scope > div');

      // Restructure first div to have each column (h2 + ul/p) in its own div
      const columnsContainer = document.createElement('div');
      const elements = firstWrapper ? Array.from(firstWrapper.children) : [];

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
    if (secondSection) {
      footer.appendChild(secondSection);
    }
  }

  block.append(footer);
}
