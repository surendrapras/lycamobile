/* global WebImporter */

/**
 * Parser for form-newsletter block
 * Base Block: form
 * Purpose: Email signup form for newsletters
 * Generated: 2025-12-20
 */

export default function parse(element, { document }) {
  // Extract form heading and content
  const heading = element.closest('.EmailLeadCaptuare_main_container__jNey1')?.querySelector('h2');
  const formContent = element.querySelector('.MuiGrid-container');
  
  if (!heading || !formContent) {
    return;
  }
  
  // Build cells array - heading and form content
  const cells = [[heading], [formContent]];
  
  // Create block
  const block = WebImporter.Blocks.createBlock(document, { 
    name: 'Form-Newsletter', 
    cells 
  });
  
  element.replaceWith(block);
}
