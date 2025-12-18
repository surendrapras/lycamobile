/* global WebImporter */

/**
 * Parser for accordion-faq block variant
 * Extracts FAQ accordion items with questions and answers
 *
 * Structure: Multiple rows [Question | Answer]
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all FAQ items - look for accordion items or question/answer patterns
  const faqItems = element.querySelectorAll('.MuiAccordion-root, .MuiCollapse-root, [role="button"]');

  if (faqItems.length > 0) {
    // Parse MUI accordion structure
    faqItems.forEach((item) => {
      const question = item.querySelector('.MuiAccordionSummary-content, [role="button"]');
      const answer = item.querySelector('.MuiAccordionDetails-root, .MuiCollapse-wrapper');

      if (question && answer) {
        const questionText = question.textContent.trim();
        const answerText = answer.textContent.trim();

        if (questionText && answerText) {
          cells.push([questionText, answerText]);
        }
      }
    });
  } else {
    // Fallback: look for question/answer pairs by text pattern
    const allParagraphs = element.querySelectorAll('p, h3, h4, strong');
    let currentQuestion = null;

    allParagraphs.forEach((el) => {
      const text = el.textContent.trim();
      // Questions typically end with "?" or are in headings
      if (text.endsWith('?') || el.matches('h3, h4, strong')) {
        if (currentQuestion) {
          // Save previous Q&A if exists
          cells.push([currentQuestion, '']);
        }
        currentQuestion = text;
      } else if (currentQuestion && text) {
        // This is likely the answer
        cells.push([currentQuestion, text]);
        currentQuestion = null;
      }
    });
  }

  // Create the block using WebImporter
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Accordion-Faq',
    cells,
  });

  // Replace the element with the block
  element.replaceWith(block);
}
