/* global WebImporter */

/**
 * Parser for columns-features block variant
 * Extracts 3-column feature highlights with icons, titles, and descriptions
 *
 * Structure: 1 row with 3 columns [icon + title + text | icon + title + text | icon + title + text]
 */
export default function parse(element, { document }) {
  const cells = [[]];

  // Find the three feature columns
  const featureImages = ['7697ced76bdac3323d4310fcc9f05e73', 'f96428fcf72bbb1ee55e313f05ce8150', 'd1f013d5de20544c67d911ecf2ceebd0'];

  featureImages.forEach(imageId => {
    const col = document.createElement('div');

    // Find the feature by image
    const img = element.querySelector(`img[src*="${imageId}"]`);
    if (img) {
      col.appendChild(img.cloneNode(true));

      // Find the associated heading and text
      const parentSection = img.closest('.MuiGrid-root, div');
      if (parentSection) {
        const heading = parentSection.querySelector('h2, h3, strong, b, .MuiTypography-root');
        if (heading) {
          const h3 = document.createElement('h3');
          h3.textContent = heading.textContent.trim();
          col.appendChild(h3);
        }

        const description = parentSection.querySelector('p');
        if (description) {
          const p = document.createElement('p');
          p.textContent = description.textContent.trim();
          col.appendChild(p);
        }
      }
    }

    cells[0].push(col);
  });

  // Create the block using WebImporter
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Columns-Features',
    cells
  });

  // Replace the element with the block
  element.replaceWith(block);
}
