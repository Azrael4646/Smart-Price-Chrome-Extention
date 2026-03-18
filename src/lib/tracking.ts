export interface ClickEvent {
  product: string;
  store: string;
  price: number;
  savings: number;
  timestamp: number;
}

export interface ClickStats {
  totalClicks: number;
  storeClicks: Record<string, number>;
  history: ClickEvent[];
}

export async function trackClick(event: ClickEvent): Promise<void> {
  console.log("Tracking click event:", event);
  
  // Store locally in Chrome storage if available
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['clickStats'], (result) => {
      const stats: ClickStats = (result.clickStats as ClickStats) || { totalClicks: 0, storeClicks: {}, history: [] };
      
      stats.totalClicks++;
      stats.storeClicks[event.store] = (stats.storeClicks[event.store] || 0) + 1;
      stats.history.push(event);
      
      chrome.storage.local.set({ clickStats: stats });
    });
  } else {
    // Fallback for web preview
    const statsStr = localStorage.getItem('clickStats');
    const stats: ClickStats = statsStr ? JSON.parse(statsStr) : { totalClicks: 0, storeClicks: {}, history: [] };
    
    stats.totalClicks++;
    stats.storeClicks[event.store] = (stats.storeClicks[event.store] || 0) + 1;
    stats.history.push(event);
    
    localStorage.setItem('clickStats', JSON.stringify(stats));
  }
}

export async function getStats(): Promise<ClickStats> {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['clickStats'], (result) => {
        resolve((result.clickStats as ClickStats) || { totalClicks: 0, storeClicks: {}, history: [] });
      });
    });
  } else {
    const statsStr = localStorage.getItem('clickStats');
    return statsStr ? JSON.parse(statsStr) : { totalClicks: 0, storeClicks: {}, history: [] };
  }
}
