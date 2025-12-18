/**
 * Fetches placeholder content for localization
 * @returns {Promise<Object>} Object with placeholder key-value pairs
 */
// eslint-disable-next-line import/prefer-default-export
export async function fetchPlaceholders() {
  // Return default English placeholders
  return {
    carousel: 'Carousel',
    carouselSlideControls: 'Carousel Slide Controls',
    previousSlide: 'Previous Slide',
    nextSlide: 'Next Slide',
    showSlide: 'Show Slide',
    of: 'of',
  };
}
