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

  // Clear the block and add tablist
  block.innerHTML = '';
  block.appendChild(tablist);

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
}
