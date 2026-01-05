export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-download-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-download-img-col');
        }
      }
    });
  });

  // special logic: replace h2 with the 2nd image (title image)
  // based on dom inspection, the title image is the 2nd picture in the block
  const pics = block.querySelectorAll('picture');
  if (pics.length >= 2) {
    // 0 is phone, 1 is title, 2+ are checks/buttons
    const titleImg = pics[1];
    
    // Check if this image looks like a title (optional safety, skipping for now)
    // Find the H2 (which might have been created from the original text header)
    const h2 = block.querySelector('h2');
    
    if (h2 && titleImg) {
      const parent = titleImg.closest('p');
      
      // Clear H2 and move the image into it
      h2.textContent = '';
      h2.append(titleImg);
      
      // Clean up the empty parent paragraph if it exists
      if (parent && parent.children.length === 0 && !parent.textContent.trim()) {
        parent.remove();
      }
    }
  }
}
