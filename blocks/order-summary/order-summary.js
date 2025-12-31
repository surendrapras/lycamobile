console.log('Order Summary: Module loaded');

export default function decorate(block) {
  // Extract query parameters
  const params = new URLSearchParams(window.location.search);
  const planName = params.get('plan');
  const planPrice = params.get('price');
  const period = params.get('period');

  console.log('Order Summary Decorate: Start', { planName, planPrice, period });

  // Clean URL parameters
  if (planName || planPrice || period) {
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }

  // Logic to update the block content based on query params
  if (planName || planPrice) {
    const rows = [...block.children];
    console.log('Order Summary: Found rows', rows.length);

    rows.forEach((row, index) => {
      const children = [...row.children];
      if (children.length < 2) {
        console.log(`Row ${index} skipped: insufficient children`);
        return;
      }

      const labelCell = children[0];
      const valueCell = children[1];
      const label = labelCell.textContent.trim().toLowerCase().replace(/\s+/g, ' ');
      console.log(`Row ${index} Label: "${label}"`);

      if (label.includes('plan name') || label.includes('nom du forfait') || label.includes('forfait') || label.includes('plan') || label.includes('offre') || label.includes('details') || label.includes('description')) {
        console.log('Match found for Plan Name');
        if (planName) valueCell.textContent = planName;
      } else if (label.includes('monthly cost') || label.includes('coût mensuel') || label.includes('crédit') || label.includes('prix') || label.includes('total') || label.includes('montant') || label.includes('mensuel')) {
        console.log('Match found for Monthly Cost');
        if (planPrice) {
            valueCell.textContent = planPrice;
            if (period === '1') {
                valueCell.textContent += ' (sans engagement)';
            } else if (period === '24') {
                valueCell.textContent += ' (contrat de 24 mois)';
            }
        }
      }
    });
  }
}
