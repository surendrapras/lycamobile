/* global WebImporter */

/**
 * Parser for cards-blog block
 * Base Block: cards
 * Purpose: Grid of blog post cards with images and descriptions
 * Generated: 2025-12-20
 */

export default function parse(element, { document }) {
  // Extract blog cards
  const blogCards = element.querySelectorAll('[id^="mobile-blocks-content-"]');
  
  if (!blogCards || blogCards.length === 0) {
    return;
  }
  
  // Build cells array - one column per blog card
  const cells = [Array.from(blogCards)];
  
  // Create block
  const block = WebImporter.Blocks.createBlock(document, { 
    name: 'Cards-Blog', 
    cells 
  });
  
  element.replaceWith(block);
}
