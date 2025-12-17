/* global WebImporter */

/**
 * Parser for tabs-contract block variant
 * Extracts tab labels and content from contract duration tabs
 *
 * Structure: Each tab = 1 row with 2 columns [tab label | tab content]
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all tab panels
  const tabPanels = element.querySelectorAll('.Tabs_innerPanelContainer__53f9Q');

  tabPanels.forEach(panel => {
    const row = [];

    // Extract tab label
    const labelElement = panel.querySelector('.PayMonthlyPage_tabPanelTitle__dhFE_');
    const label = labelElement ? labelElement.textContent.trim() : '';

    row.push(label);

    // For now, tab content is placeholder - will be populated dynamically
    row.push(`(Content for ${label} plans)`);

    cells.push(row);
  });

  // Create the block using WebImporter
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Tabs-Contract',
    cells
  });

  // Replace the element with the block
  element.replaceWith(block);
}
