// Listen for requests for page info from the popup
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'get_product_info') {
      const title = document.querySelector('h1')?.innerText || document.title;
      const priceEl = document.querySelector('.pdp-main-panel [class*="price"], [class*="price"], [id*="price"], .currency, .amount');
      const price = priceEl ? priceEl.innerText : '';
      sendResponse({ title, price, url: window.location.href });
    }
  });
}
