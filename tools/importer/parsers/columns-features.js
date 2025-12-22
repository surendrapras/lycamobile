/* global WebImporter */

/**
 * Parser for columns-features block
 * Base Block: columns
 * Purpose: Multi-column layout for feature highlights
 * Generated: 2025-12-20
 */

export default function parse(element, { document }) {
  // Extract feature columns
  const features = element.querySelectorAll('[id^="static-mobile-block-content-"]');

  if (!features || features.length === 0) {
    return;
  }

  // Build cells array - one column per feature
  const cells = [Array.from(features)];

  // Create block
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Columns-Features',
    cells,
  });

  element.replaceWith(block);
}
