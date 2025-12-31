/*
 * FR Accordion FAQ block
 */

export default function decorate(block) {
  [...block.children].forEach((row, index) => {
    if (row.children.length < 2) {
      return;
    }

    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'fr-accordion-faq-item-label';
    const labelText = document.createElement('span');
    labelText.className = 'fr-accordion-faq-item-label-text';
    labelText.append(...label.childNodes);
    summary.append(labelText);

    const body = row.children[1];
    body.className = 'fr-accordion-faq-item-body';

    const details = document.createElement('details');
    details.className = 'fr-accordion-faq-item';
    if (index === 0) {
      details.open = true;
    }
    details.append(summary, body);
    row.replaceWith(details);
  });
}
