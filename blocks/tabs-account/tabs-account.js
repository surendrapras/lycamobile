export default function decorate(block) {
  // Create card container
  const card = document.createElement('div');
  card.className = 'tabs-account-card';

  // Get all rows from the block
  const rows = [...block.children];

  // Process each row
  rows.forEach((row, index) => {
    const cells = [...row.children];

    if (index === 0) {
      // First row: Icon (if present)
      const iconCell = cells[0];
      const icon = iconCell.querySelector('picture');
      if (icon) {
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'tabs-account-icon';
        iconWrapper.appendChild(icon);
        card.appendChild(iconWrapper);
      }
    } else if (index === 1) {
      // Second row: Heading
      const heading = cells[0].querySelector('h2, h3, strong');
      if (heading) {
        const h2 = document.createElement('h2');
        h2.textContent = heading.textContent;
        card.appendChild(h2);
      }
    } else if (index === 2) {
      // Third row: Description
      const description = document.createElement('div');
      description.className = 'tabs-account-description';
      description.innerHTML = cells[0].innerHTML;
      card.appendChild(description);
    } else if (index === 3) {
      // Fourth row: Tabs (Top up, Renew plan, Switch to Pay monthly)
      const tabsContainer = document.createElement('div');
      tabsContainer.className = 'tabs-account-tabs';

      cells.forEach((cell, cellIndex) => {
        const link = cell.querySelector('a');
        const text = link ? link.textContent : cell.textContent;
        const href = link ? link.getAttribute('href') : '#';

        if (text.trim()) {
          const tab = document.createElement('a');
          tab.className = 'tabs-account-tab';
          tab.textContent = text.trim();
          tab.href = href;

          // Add active class to first tab by default
          if (cellIndex === 0) {
            tab.classList.add('active');
          }

          // Add click event listener for active state management
          tab.addEventListener('click', (e) => {
            // If it's a link to external page, let it navigate
            if (href !== '#') {
              return;
            }

            // Prevent default for placeholder tabs
            e.preventDefault();

            // Remove active class from all tabs
            tabsContainer.querySelectorAll('.tabs-account-tab').forEach((t) => {
              t.classList.remove('active');
            });

            // Add active class to clicked tab
            tab.classList.add('active');
          });

          tabsContainer.appendChild(tab);
        }
      });

      card.appendChild(tabsContainer);
    } else {
      // Remaining rows: Content (images, links, etc.)
      const content = document.createElement('div');
      content.className = 'tabs-account-content';
      cells.forEach((cell) => {
        if (cell.innerHTML.trim()) {
          // Check if cell contains a paragraph already
          const existingP = cell.querySelector('p');
          if (existingP) {
            // Clone and append the existing paragraph
            content.appendChild(existingP.cloneNode(true));
          } else {
            // Create a new paragraph with cell content
            const p = document.createElement('p');
            p.innerHTML = cell.innerHTML;
            content.appendChild(p);
          }
        }
      });
      if (content.children.length > 0) {
        card.appendChild(content);
      }
    }
  });

  // Clear the block and add the card
  block.textContent = '';
  block.appendChild(card);
}
