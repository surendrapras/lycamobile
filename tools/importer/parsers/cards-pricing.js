/* global WebImporter */

/**
 * Parser for cards-pricing block variant
 * Extracts pricing plan cards with badges, prices, data allowance, and features
 *
 * Structure: Each card = 1 row with 2 columns [images | card content]
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all plan cards
  const planCards = element.querySelectorAll('.PlanCardFullWidth_planCardContainer__rx5TX');

  planCards.forEach((card) => {
    const row = [];

    // Column 1: Images (badges)
    const images = [];
    const badgeContainer = card.querySelector('.PlanCardFullWidth_containerItems__yT0yM');
    if (badgeContainer) {
      const imgs = badgeContainer.querySelectorAll('img');
      imgs.forEach((img) => {
        if (img.src) {
          images.push(img.cloneNode(true));
        }
      });
    }

    const imageCell = document.createElement('div');
    images.forEach((img) => imageCell.appendChild(img));
    row.push(imageCell);

    // Column 2: Card content
    const contentCell = document.createElement('div');

    // Plan name
    const planName = card.querySelector('.PlanCardFullWidth_saverTextLight__miPlQ, h2');
    if (planName) {
      const h2 = document.createElement('h2');
      h2.textContent = planName.textContent.trim();
      contentCell.appendChild(h2);
    }

    // Pricing
    const strikePrice = card.querySelector('.PlanCardFullWidth_basePriceText__vEAaH');
    const newPrice = card.querySelector('.PlanCardFullWidth_promotionPriceText__SPQl1');
    if (strikePrice && newPrice) {
      const priceP = document.createElement('p');
      const strike = document.createElement('del');
      strike.textContent = strikePrice.textContent.trim();
      priceP.appendChild(strike);
      priceP.appendChild(document.createTextNode(' '));
      const strong = document.createElement('strong');
      strong.textContent = newPrice.textContent.trim();
      priceP.appendChild(strong);
      priceP.appendChild(document.createTextNode(' monthly'));
      contentCell.appendChild(priceP);
    }

    // Data allowance
    const dataAllowance = card.querySelector('.PlanCardFullWidth_promotionPriceText__SPQl1');
    if (dataAllowance && (dataAllowance.textContent.includes('GB') || dataAllowance.textContent.includes('Unlimited'))) {
      const dataP = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = dataAllowance.textContent.trim();
      dataP.appendChild(strong);
      contentCell.appendChild(dataP);
    }

    // Features list
    const features = card.querySelectorAll('[id^="plan-has-detail-"]');
    if (features.length > 0) {
      const ul = document.createElement('ul');
      features.forEach((feature) => {
        const li = document.createElement('li');
        li.textContent = feature.textContent.trim();
        ul.appendChild(li);
      });
      contentCell.appendChild(ul);
    }

    // Action links
    const viewMore = card.querySelector('.PlanCardFullWidth_viewMoreText__QFcZ_');
    const buyNow = card.querySelector('button');
    if (viewMore || buyNow) {
      const linksP = document.createElement('p');
      if (viewMore) {
        const a1 = document.createElement('a');
        a1.href = '#';
        a1.textContent = 'View more';
        linksP.appendChild(a1);
        linksP.appendChild(document.createTextNode(' '));
      }
      if (buyNow) {
        const a2 = document.createElement('a');
        a2.href = '#';
        a2.textContent = 'Buy now';
        linksP.appendChild(a2);
      }
      contentCell.appendChild(linksP);
    }

    row.push(contentCell);
    cells.push(row);
  });

  // Create the block using WebImporter
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Cards-Pricing',
    cells
  });

  // Replace the element with the block
  element.replaceWith(block);
}
