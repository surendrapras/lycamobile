import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-blog-card-image';
      else div.className = 'cards-blog-card-body';
    });

    // Merge author column if present to ensure "Date | Author" format
    const bodies = li.querySelectorAll('.cards-blog-card-body');
    if (bodies.length > 1) {
      const [mainBody, authorBody] = bodies;
      const dateP = mainBody.querySelector('p:last-child');
      const authorP = authorBody.querySelector('p');
      if (dateP && authorP) {
        dateP.textContent += ` | ${authorP.textContent}`;
      }
      authorBody.remove();
    }

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);

  const container = block.closest('.cards-blog-container');
  if (container) {
    const title = container.querySelector('.default-content-wrapper > p:first-child');
    if (title) {
      const hasAuthorMarkup = title.hasAttribute('style')
        || title.classList.length > 0
        || title.querySelector('span, font, [style], [class]');
      if (hasAuthorMarkup) container.classList.add('cards-blog-title-authored');
    }
  }
}
