export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-app-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-app-img-col');
        }
      }
    });
  });

  // special logic for 'Download App' variant
  // Detect based on number of pictures
  const pics = block.querySelectorAll('picture');
  if (pics.length >= 5) {
    // pics[0] is the main static image (Left Column)
    // pics[1] is the authored image (Right Column, currently small)
    
    const authoredImg = pics[1];
    
    // Find the left column wrapper
    const leftCol = block.querySelector('.columns-app-img-col');
    
    if (leftCol && authoredImg) {
      // Get the parent of the authored image before moving it, to clean up later
      const authorImgParent = authoredImg.closest('p');

      // Clear the left column (removing the static image)
      leftCol.innerHTML = '';
      
      // Move the authored image to the left column
      leftCol.append(authoredImg);
      
      // Clean up the empty paragraph in the right column
      if (authorImgParent && authorImgParent.children.length === 0 && !authorImgParent.textContent.trim()) {
        authorImgParent.remove();
      }
    }
  }
}
