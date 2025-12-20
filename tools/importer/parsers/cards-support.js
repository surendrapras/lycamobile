/* global WebImporter */

/**
 * Parser for cards-support block
 * Base Block: cards
 * Purpose: Grid of support/help items
 * Generated: 2025-12-20
 */

export default function parse(element, { document }) {
  // Extract support help icons
  const helpItems = element.querySelectorAll('[id^="help-icons-content-"]');

  if (!helpItems || helpItems.length === 0) {
    return;
  }

  // Build cells array - one column per help item
  const cells = [Array.from(helpItems)];

  // Create block
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Cards-Support',
    cells,
  });

  element.replaceWith(block);
}
