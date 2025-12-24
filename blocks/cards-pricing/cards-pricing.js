import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  // Extract contract duration
  const durationMatch = block.className.match(/contract-duration-(\d+)/i);
  if (durationMatch) {
    [, block.dataset.contractDuration] = durationMatch;
  }

  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    while (row.firstElementChild) {
      li.append(row.firstElementChild);
    }

    [...li.children].forEach((div) => {
      // Image block
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-pricing-card-image';
        return;
      }

      // Remove empty blocks
      if (!div.textContent.trim()) {
        div.remove();
        return;
      }

      div.className = 'cards-pricing-card-body';

      const paragraphs = [...div.children].filter(
        (el) => el.tagName === 'P',
      );

      // Ignore title-only body
      if (paragraphs.length < 3) return;

      const summaryWrapper = document.createElement('div');
      summaryWrapper.className = 'cards-pricing-card-summary';

      const firstHasEm = paragraphs[0].querySelector('em');

      if (firstHasEm) {
        // Offer exists → wrap p[1], p[2], p[3]
        if (paragraphs.length >= 4) {
          summaryWrapper.append(
            paragraphs[1],
            paragraphs[2],
            paragraphs[3],
          );
          paragraphs[0].after(summaryWrapper);
        }
      } else {
        // NO offer → wrap first 3 paragraphs
        summaryWrapper.append(
          paragraphs[0],
          paragraphs[1],
          paragraphs[2],
        );
        div.prepend(summaryWrapper);
      }
    });

    if (li.children.length) {
      ul.append(li);
    }
  });

  // Optimize images
  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
    );
  });

  block.replaceChildren(ul);
}
