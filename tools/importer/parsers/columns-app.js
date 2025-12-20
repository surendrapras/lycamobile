/* global WebImporter */

/**
 * Parser for columns-app block
 * Base Block: columns
 * Purpose: Two-column layout for app features/information
 * Generated: 2025-12-20
 */

export default function parse(element, { document }) {
  // Extract app image and content
  const appImage = element.querySelector('#app-download-image');
  const appContent = element.querySelector('#app-download-content');

  if (!appImage || !appContent) {
    return;
  }

  // Build cells array - two columns
  const cells = [[appImage, appContent]];

  // Create block
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Columns-App',
    cells,
  });

  element.replaceWith(block);
}
