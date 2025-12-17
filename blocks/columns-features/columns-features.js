export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-features-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-features-img-col');
        }
      }
    });
  });

  // Add carousel functionality for mobile
  const container = block.firstElementChild;
  const items = [...container.children];

  if (items.length > 1) {
    // Wrap items in carousel container
    const carousel = document.createElement('div');
    carousel.className = 'columns-features-carousel';

    const track = document.createElement('div');
    track.className = 'columns-features-track';

    items.forEach((item) => {
      track.appendChild(item);
    });

    carousel.appendChild(track);
    container.appendChild(carousel);

    // Create navigation arrows
    const prevButton = document.createElement('button');
    prevButton.className = 'columns-features-nav columns-features-nav-prev';
    prevButton.setAttribute('aria-label', 'Previous feature');
    prevButton.innerHTML = '<span>&larr;</span>';

    const nextButton = document.createElement('button');
    nextButton.className = 'columns-features-nav columns-features-nav-next';
    nextButton.setAttribute('aria-label', 'Next feature');
    nextButton.innerHTML = '<span>&rarr;</span>';

    carousel.appendChild(prevButton);
    carousel.appendChild(nextButton);

    // Create pagination dots
    const pagination = document.createElement('div');
    pagination.className = 'columns-features-pagination';

    items.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'columns-features-dot';
      dot.setAttribute('aria-label', `Go to feature ${index + 1}`);
      if (index === 0) dot.classList.add('active');
      pagination.appendChild(dot);
    });

    carousel.appendChild(pagination);

    // Carousel state
    let currentIndex = 0;

    const updateCarousel = () => {
      const offset = -currentIndex * 100;
      track.style.transform = `translateX(${offset}%)`;

      // Update dots
      pagination.querySelectorAll('.columns-features-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });

      // Update button states
      prevButton.disabled = currentIndex === 0;
      nextButton.disabled = currentIndex === items.length - 1;
    };

    // Navigation handlers
    prevButton.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex -= 1;
        updateCarousel();
      }
    });

    nextButton.addEventListener('click', () => {
      if (currentIndex < items.length - 1) {
        currentIndex += 1;
        updateCarousel();
      }
    });

    // Dot navigation
    pagination.querySelectorAll('.columns-features-dot').forEach((dot, index) => {
      dot.addEventListener('click', () => {
        currentIndex = index;
        updateCarousel();
      });
    });

    // Touch support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });

    const handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && currentIndex < items.length - 1) {
          currentIndex += 1;
          updateCarousel();
        } else if (diff < 0 && currentIndex > 0) {
          currentIndex -= 1;
          updateCarousel();
        }
      }
    };

    // Initialize
    updateCarousel();
  }
}
