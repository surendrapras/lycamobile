// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';

export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-contract-list';
  tablist.setAttribute('role', 'tablist');

  // Get all tabs from the single row
  const tabRow = block.querySelector('div');
  if (!tabRow) return;

  const tabs = [...tabRow.children];

  // Create a common wrapper for layout
  const wrapper = document.createElement('div');
  wrapper.className = 'tabs-common-wrapper';
  wrapper.appendChild(tablist);

  // Clear the block and add wrapper
  block.innerHTML = '';
  block.appendChild(wrapper);

  // Map tab text to contract duration values
  const contractMap = {
    '24-months': '24',
    '12-months': '12',
    '1-month': '1',
  };

  // Function to find all Cards-Pricing blocks in the page
  function findCardsBlocks() {
    return document.querySelectorAll('.cards-pricing');
  }

  // Function to filter cards based on selected tab
  function filterCards(duration) {
    const cardsBlocks = findCardsBlocks();
    cardsBlocks.forEach((cardsBlock) => {
      const blockDuration = cardsBlock.getAttribute('data-contract-duration');
      const isMatch = blockDuration === duration;
      cardsBlock.style.display = isMatch ? 'block' : 'none';
      const section = cardsBlock.closest('.section');
      if (section) {
        section.style.display = isMatch ? '' : 'none';
      }
    });
  }

  tabs.forEach((tab, i) => {
    const tabText = tab.textContent.trim();
    const id = toClassName(tabText);

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-contract-tab';
    button.id = `tab-${id}`;
    button.innerHTML = tab.innerHTML;
    button.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');

    button.addEventListener('click', () => {
      // Update tab states
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', 'false');
      });
      button.setAttribute('aria-selected', 'true');

      // Filter cards based on selected tab
      const duration = contractMap[id];
      if (duration) {
        filterCards(duration);
      }
    });

    tablist.append(button);
  });

  // Initialize with first tab selected (24 months)
  // Wait for all blocks to be decorated before filtering
  let initialized = false;
  const waitForCards = setInterval(() => {
    const cardsBlocks = findCardsBlocks();
    // Check if all blocks have data-contract-duration attribute
    const allDecorated = cardsBlocks.length > 0
      && Array.from(cardsBlocks).every((cardsBlock) => cardsBlock.hasAttribute('data-contract-duration'));

    if (allDecorated && !initialized) {
      initialized = true;
      clearInterval(waitForCards);
      const firstTabId = toClassName(tabs[0].textContent.trim());
      const firstDuration = contractMap[firstTabId];
      if (firstDuration) {
        filterCards(firstDuration);
      }
    }
  }, 50);

  // Fallback: clear interval after 2 seconds
  setTimeout(() => {
    clearInterval(waitForCards);
    // If still not initialized, force it
    if (!initialized) {
      initialized = true;
      const firstTabId = toClassName(tabs[0].textContent.trim());
      const firstDuration = contractMap[firstTabId];
      if (firstDuration) {
        filterCards(firstDuration);
      }
    }
  }, 2000);

  // Sorting Dropdown Implementation
  // Only for specific URL
  if (window.location.pathname.endsWith('/paymonthly/en/bundles/sim-only-deals/paymonthly')) {
    block.classList.add('has-sorting');

    // Create a wrapper for relative positioning context if needed,
    // but block usually suffices if we style it right.
    // However, let's keep the structure clean.

    const sortContainer = document.createElement('div');
    sortContainer.className = 'sort-container';

    // SVG Icons
    const filterIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M6 12H18M10 18H14" stroke="#1F2A5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const chevronIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10L12 15L17 10" fill="#000000" fill-opacity="0.54"/></svg>'; // Standard MUI chevron look

    // Sort Icons (Purple/Blue #1F2A5A)
    const starIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#1F2A5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const lowHighIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 19V5M5 12L12 5L19 12" stroke="#1F2A5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const highLowIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V19M19 12L12 19L5 12" stroke="#1F2A5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    // Dropdown HTML
    sortContainer.innerHTML = `
      <div class="custom-select-wrapper">
          <div class="custom-select">
              <div class="custom-select-trigger">
                  <span class="trigger-active-icon">${starIcon}</span>
                  <span class="trigger-separator"></span>
                  <span class="trigger-filter-icon">${filterIcon}</span>
                  <span class="trigger-arrow">${chevronIcon}</span>
              </div>
              <div class="custom-options">
                  <span class="custom-option selected" data-value="recommended">
                      <span class="option-icon">${starIcon}</span>
                      Price : Recommended
                  </span>
                  <span class="custom-option" data-value="low-to-high">
                      <span class="option-icon">${lowHighIcon}</span>
                      Price: Low to high
                  </span>
                  <span class="custom-option" data-value="high-to-low">
                      <span class="option-icon">${highLowIcon}</span>
                      Price: High to low
                  </span>
              </div>
          </div>
      </div>
    `;

    wrapper.appendChild(sortContainer);

    // Sorting Logic
    const getPrice = (el) => {
      const priceEl = el.querySelector('.cards-pricing-price strong');
      if (!priceEl) return 0;
      const cleanPrice = priceEl.textContent.replace(/[^0-9.]/g, '');
      return parseFloat(cleanPrice) || 0;
    };

    const sortCards = (order) => {
      const cardsBlocks = findCardsBlocks();
      cardsBlocks.forEach((cardsBlock) => {
        // If sorting within each block (each duration)
        const ul = cardsBlock.querySelector('ul');
        if (!ul) return;

        const items = Array.from(ul.children);

        // Save original order if not saved
        if (!ul.dataset.originalOrder) {
          items.forEach((item, index) => {
            item.dataset.originalIndex = index;
          });
          ul.dataset.originalOrder = 'true';
        }

        if (order === 'recommended') {
          items.sort((a, b) => parseInt(a.dataset.originalIndex, 10)
            - parseInt(b.dataset.originalIndex, 10));
        } else {
          items.sort((a, b) => {
            const priceA = getPrice(a);
            const priceB = getPrice(b);
            return order === 'low-to-high' ? priceA - priceB : priceB - priceA;
          });
        }

        // Re-append in new order
        items.forEach((item) => ul.appendChild(item));
      });
    };

    // Dropdown Interactions
    const wrapperSelect = sortContainer.querySelector('.custom-select-wrapper');
    const select = wrapperSelect.querySelector('.custom-select');

    select.addEventListener('click', () => {
      select.classList.toggle('open');
    });

    const options = wrapperSelect.querySelectorAll('.custom-option');
    options.forEach((option) => {
      option.addEventListener('click', function onClick() {
        if (!this.classList.contains('selected')) {
          // Update specific selected class
          options.forEach((opt) => opt.classList.remove('selected'));
          this.classList.add('selected');

          // Update Active Icon in Trigger
          const iconHtml = this.querySelector('.option-icon').innerHTML;
          const triggerActiveIcon = select.querySelector('.custom-select-trigger .trigger-active-icon'); // Changed from double underscore
          triggerActiveIcon.innerHTML = iconHtml;

          const value = this.getAttribute('data-value');
          sortCards(value);
        }
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!select.contains(e.target)) {
        select.classList.remove('open');
      }
    });
  }
}
