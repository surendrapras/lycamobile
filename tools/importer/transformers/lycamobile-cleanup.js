/* global WebImporter */

/**
 * Transformer for Lycamobile website cleanup
 * Purpose: Remove accessibility widgets, cookie consent, and non-content elements
 * Applies to: www.lycamobile.co.uk (all templates)
 * Generated: 2025-12-20
 * 
 * SELECTORS EXTRACTED FROM:
 * - Captured DOM during migration workflow (migration-work/cleaned.html)
 * - Elements identified: access-widget-ui, onetrust-consent-sdk, announcement bar
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform'
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove accessibility widget
    // EXTRACTED: Found multiple <access-widget-ui class="notranslate"> in captured DOM
    WebImporter.DOMUtils.remove(element, [
      'access-widget-ui'
    ]);
    
    // Remove cookie consent banner
    // EXTRACTED: Found <div id="onetrust-consent-sdk"> in captured DOM at line 1024
    // EXTRACTED: Found <div class="onetrust-pc-dark-filter"> in captured DOM
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '.onetrust-pc-dark-filter',
      '#onetrust-banner-sdk'
    ]);
    
    // Remove announcement bar (non-authorable content)
    // EXTRACTED: Found <div class="FreeTrial_main_container__L_dGL" id="announcement-bar"> in captured DOM
    WebImporter.DOMUtils.remove(element, [
      '#announcement-bar',
      '.FreeTrial_main_container__L_dGL'
    ]);
    
    // Remove navigation (will use nav.md fragment)
    // EXTRACTED: Found <div class="MuiGrid-root &quot;nav-bar-main&quot;"> and <header id="node-header"> in captured DOM
    WebImporter.DOMUtils.remove(element, [
      '#nav-bar-main',
      '#node-header'
    ]);
  }
  
  if (hookName === TransformHook.afterTransform) {
    // Remove tracking scripts and styles
    // Standard HTML elements - safe to use
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'link',
      'noscript',
      'canvas'
    ]);
    
    // Clean up tracking attributes
    // Common tracking attributes found on various elements
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      el.removeAttribute('onclick');
      el.removeAttribute('data-track');
      el.removeAttribute('data-gtm');
    });
  }
}
