import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
    const ul = document.createElement('ul');

    [...block.children].forEach((row) => {
        const li = document.createElement('li');

        while (row.firstElementChild) {
            li.append(row.firstElementChild);
        }

        [...li.children].forEach((div) => {
            // Image block
            if (div.children.length === 1 && div.querySelector('picture')) {
                div.className = 'home-cards-pricing-card-image';
                return;
            }

            // Remove empty blocks
            if (!div.textContent.trim()) {
                div.remove();
                return;
            }

            div.className = 'home-cards-pricing-card-body';
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
