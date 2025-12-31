
export default function decorate(block) {
  // Container for the toggle
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'pricing-toggle-container';
  
  const toggleBtn1 = document.createElement('button');
  toggleBtn1.textContent = '24 mois';
  toggleBtn1.className = 'toggle-btn active'; // Default active
  toggleBtn1.dataset.period = '24';

  const toggleBtn2 = document.createElement('button');
  toggleBtn2.textContent = '1 mois';
  toggleBtn2.className = 'toggle-btn';
  toggleBtn2.dataset.period = '1';

  toggleContainer.append(toggleBtn1, toggleBtn2);
  
  // Container for cards
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'pricing-cards-container';

  // Parse rows
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 5) return; // Skip invalid rows

    // Column Mapping based on index.md
    const titleHTML = cells[0].innerHTML;
    const priceHTML = cells[1].innerHTML;
    const dataHTML = cells[2].innerHTML;
    const featuresHTML = cells[3].innerHTML;
    const linkContainer = cells[4];
    let link = linkContainer.querySelector('a');
    if (!link && linkContainer.textContent.trim()) {
        link = document.createElement('a');
        link.href = '#';
        link.textContent = linkContainer.textContent.trim();
    }
    
    // Determine period
    const text = (cells[0].textContent + cells[1].textContent).toLowerCase();
    const isOneMonth = text.includes('sans engagement');
    const period = isOneMonth ? '1' : '24';
    
    // Create card
    const card = document.createElement('div');
    card.className = `pricing-card period-${period} ${period === '24' ? '' : 'hidden'}`;
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-top-row">
                <h3 class="card-title">${titleHTML}</h3>
            <div class="card-icons">
                    <img src="https://pim-assets-paym.globalldplatform.com/_default_upload_bucket/eSIM%201%20%285%29_3.png" alt="eSIM" width="24" height="24">
                    <img src="https://pim-assets-paym.globalldplatform.com/_default_upload_bucket/5G%201%20%285%29_1.png" alt="5G" width="24" height="24">
                </div>
            </div>
            <div class="card-details-row">
                <div class="card-data-badge">
                     <span class="data-amount">${dataHTML}</span>
                     <span class="data-label">data</span>
                </div>
                 <div class="card-price">
                    ${priceHTML}
                    <span class="price-period">par mois</span>
                </div>
            </div>
        </div>
        <div class="card-features">
            ${featuresHTML}
            <a href="#" class="view-more">Voir plus</a>
        </div>
        <div class="card-action">
             ${link ? link.outerHTML : ''}
        </div>
    `;

    // Add buttons class
    const btn = card.querySelector('.card-action a');
    if(btn) btn.className = 'button primary';

    cardsContainer.append(card);
  });

  // Event Listeners for Toggle
  const toggleBtns = [toggleBtn1, toggleBtn2];
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Toggle Active Class
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show/Hide Cards
        const period = btn.dataset.period;
        const allCards = cardsContainer.querySelectorAll('.pricing-card');
        allCards.forEach(c => {
            if(c.classList.contains(`period-${period}`)) {
                c.classList.remove('hidden');
            } else {
                c.classList.add('hidden');
            }
        });
    });
  });

  block.textContent = ''; // Clear original content
  block.append(toggleContainer, cardsContainer);

  // Normalize feature bullets: remove leading asterisks and inject tick icons
  cardsContainer.querySelectorAll('.card-features').forEach((features) => {
    const viewMore = features.querySelector('.view-more');
    const listItems = [...features.querySelectorAll('li')];

    if (!listItems.length) {
      const text = features.textContent || '';
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.replace(/^[*\\s]+/, '').trim())
        .filter((line) => line && line.toLowerCase() !== 'voir plus');
      if (lines.length) {
        const ul = document.createElement('ul');
        lines.forEach((line) => {
          const li = document.createElement('li');
          li.textContent = line;
          ul.append(li);
        });
        features.innerHTML = '';
        features.append(ul);
      }
    }

    const items = [...features.querySelectorAll('li')];
    items.forEach((li) => {
      const cleaned = li.textContent.replace(/^[*\\s]+/, '').trim();
      li.textContent = cleaned;
      if (!li.querySelector('.feature-tick')) {
        const tick = document.createElement('img');
        tick.className = 'feature-tick';
        tick.src = 'https://www.lycamobile.fr/abo/_next/static/media/greenTick2.ebb6f697.svg';
        tick.alt = 'greenTick';
        tick.width = 14;
        tick.height = 10;
        li.classList.add('has-tick');
        li.prepend(tick);
      }
    });

    if (viewMore && !features.contains(viewMore)) {
      features.append(viewMore);
    }
  });
}
