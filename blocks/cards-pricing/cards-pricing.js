import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  // Extract contract duration from block classes (e.g., "contract-duration-24")
  const blockClasses = block.className;
  const durationMatch = blockClasses.match(/contract-duration-(\d+)/i);
  if (durationMatch) {
    block.setAttribute('data-contract-duration', durationMatch[1]);
  }

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-pricing-card-image';
      else div.className = 'cards-pricing-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
