export function convertToAffiliateLink(url: string, store: string): string {
  try {
    const urlObj = new URL(url);
    
    switch (store.toLowerCase()) {
      case 'takealot':
        urlObj.searchParams.set('tag', 'smartpricesa-20');
        break;
      case 'amazon.co.za':
      case 'amazon':
        urlObj.searchParams.set('tag', 'smartpricesa-21');
        break;
      case 'wootware':
        urlObj.searchParams.set('aff', 'smartprice');
        break;
      case 'evetech':
        urlObj.searchParams.set('ref', 'smartprice');
        break;
      default:
        // Placeholder for other stores
        urlObj.searchParams.set('ref', 'smartpricesa');
        break;
    }
    
    return urlObj.toString();
  } catch (e) {
    console.error("Invalid URL:", url);
    return url;
  }
}
