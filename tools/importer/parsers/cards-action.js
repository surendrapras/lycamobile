/* global WebImporter */

/**
 * Parser for cards-action block
 * Base Block: cards
 * Purpose: Grid of action items with call-to-action elements
 * Generated: 2025-12-20
 */

export default function parse(element, { document }) {
  // Extract action buttons/tabs
  const tabs = element.querySelectorAll('button[id^="switch-tab"]');
  
  if (!tabs || tabs.length === 0) {
    return;
  }
  
  // Build cells array - each tab becomes a column
  const cells = [Array.from(tabs).map(tab => {
    const text = tab.querySelector('p')?.textContent || tab.textContent;
    const link = tab.querySelector('a');
    return link || text;
  })];
  
  // Create block
  const block = WebImporter.Blocks.createBlock(document, { 
    name: 'Cards-Action', 
    cells 
  });
  
  element.replaceWith(block);
}
