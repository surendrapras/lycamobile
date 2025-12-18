/**
 * Transformer for Lycamobile site-wide cleanup
 * Removes navigation, headers, footers, cookie banners, and non-content elements
 *
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - Main document element
 */
export default function transform(hookName, element) {
  if (hookName === 'beforeTransform') {
    // Remove navigation and header elements
    const nav = element.querySelector('.Navbar_topContainer__MJq7l');
    if (nav) nav.remove();

    const header = element.querySelector('#node-header');
    if (header) header.remove();

    // Remove breadcrumbs
    const breadcrumbs = element.querySelector('.Breadcrumbs_mainContainer__OViZh');
    if (breadcrumbs) breadcrumbs.remove();

    // Remove cookie consent banner
    const cookieBanner = element.querySelector('#onetrust-consent-sdk');
    if (cookieBanner) cookieBanner.remove();

    // Remove footer
    const footer = element.querySelector('footer');
    if (footer) footer.remove();

    // Remove scripts and styles
    element.querySelectorAll('script, style, link[rel="stylesheet"]').forEach(el => el.remove());

    // Remove empty divs that are just layout wrappers
    element.querySelectorAll('div.MuiBox-root:empty, div.MuiGrid-root:empty').forEach(el => {
      if (!el.hasChildNodes()) el.remove();
    });
  }

  if (hookName === 'afterTransform') {
    // Clean up any remaining empty elements after transformation
    element.querySelectorAll('div:empty, span:empty').forEach(el => {
      if (!el.hasChildNodes() && !el.hasAttribute('class')) el.remove();
    });
  }
}
