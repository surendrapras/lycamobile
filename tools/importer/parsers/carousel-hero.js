/* global WebImporter */

/**
 * Parser for carousel-hero block
 * Base Block: carousel-hero
 * Purpose: Hero carousel with rotating promotional banners
 * Generated: 2025-12-20
 */

export default function parse(element, { document }) {
  // Extract carousel images from slick slider
  const slides = element.querySelectorAll('.slick-slide:not(.slick-cloned) img');

  if (!slides || slides.length === 0) {
    return;
  }

  // Build cells array - one row per image
  const cells = slides.length > 0 ? Array.from(slides).map((img) => [img]) : [];

  // Create block using WebImporter
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Carousel-Hero',
    cells,
  });

  // Replace element with block
  element.replaceWith(block);
}
