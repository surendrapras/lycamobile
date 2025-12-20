/* global WebImporter */

/**
 * Parser for carousel-flags block
 * Base Block: carousel
 * Purpose: Rotating carousel of country flags
 * Generated: 2025-12-20
 */

export default function parse(element, { document }) {
  // Extract flag images from carousel
  const flags = element.querySelectorAll('.slick-slide:not(.slick-cloned) [id^="country-name-"]');

  if (!flags || flags.length === 0) {
    return;
  }

  // Build cells array - one row per flag
  const cells = Array.from(flags).map((flag) => [flag]);

  // Create block
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Carousel-Flags',
    cells,
  });

  element.replaceWith(block);
}
