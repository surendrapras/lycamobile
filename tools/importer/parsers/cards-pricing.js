/* global WebImporter */

/**
 * Parser for cards-pricing block
 * Base Block: cards
 * Purpose: Grid of pricing plans with features and pricing
 * Generated: 2025-12-20
 */

export default function parse(element, { document }) {
  // Extract pricing card images
  const cardImages = element.querySelectorAll('img[id="bannerWeb"]');
  
  if (!cardImages || cardImages.length === 0) {
    return;
  }
  
  // Build cells array - one column per pricing card
  const cells = [Array.from(cardImages)];
  
  // Create block
  const block = WebImporter.Blocks.createBlock(document, { 
    name: 'Cards-Pricing', 
    cells 
  });
  
  element.replaceWith(block);
}
