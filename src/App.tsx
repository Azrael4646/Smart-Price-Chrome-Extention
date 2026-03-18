import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Tag, ExternalLink, Image as ImageIcon, BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import { findCheaperProducts, ProductResult, generateWishlistImage } from './lib/api';
import { convertToAffiliateLink } from './lib/affiliate';
import { trackClick, getStats, ClickStats } from './lib/tracking';

// Mock product for preview when not running as an extension
const MOCK_PRODUCT = {
  title: "Sony PlayStation 5 Console",
  price: "11999",
  url: "https://www.example.com/ps5"
};

export default function App() {
  const [isPopup, setIsPopup] = useState(false);
  const [activeTab, setActiveTab] = useState<'deals' | 'analytics' | 'avatar'>('deals');
  const [currentProduct, setCurrentProduct] = useState<{title: string, price: string, url: string} | null>(null);
  const [deals, setDeals] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ClickStats | null>(null);
  
  // Avatar generation state
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isPopupMode = params.get('popup') === 'true';
    setIsPopup(isPopupMode);

    if (!isPopupMode) {
      // We are in the full tab
      const title = params.get('title');
      const price = params.get('price');
      const url = params.get('url');

      if (title && price && url) {
        const product = { title, price, url };
        setCurrentProduct(product);
        fetchDeals(title, parseFloat(price.replace(/[^0-9.]/g, '')));
      } else {
        // Fallback for web preview
        setCurrentProduct(MOCK_PRODUCT);
        fetchDeals(MOCK_PRODUCT.title, parseFloat(MOCK_PRODUCT.price));
      }
      loadStats();
    }
  }, []);

  const loadStats = async () => {
    const currentStats = await getStats();
    setStats(currentStats);
  };

  const fetchDeals = async (title: string, price: number) => {
    setLoading(true);
    try {
      const results = await findCheaperProducts(title, price || 0);
      setDeals(results);
    } catch (e) {
      console.error("Failed to fetch deals", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDealClick = (deal: ProductResult) => {
    const currentPrice = currentProduct ? parseFloat(currentProduct.price.replace(/[^0-9.]/g, '')) : 0;
    const savings = Math.max(0, currentPrice - deal.price);
    
    trackClick({
      product: deal.title,
      store: deal.store,
      price: deal.price,
      savings: savings,
      timestamp: Date.now()
    });
    
    const affiliateUrl = convertToAffiliateLink(deal.url, deal.store);
    window.open(affiliateUrl, '_blank');
  };

  const handleGenerateAvatar = async () => {
    if (!apiKey) {
      alert("Please enter your Gemini API Key to generate images.");
      return;
    }
    
    setAvatarLoading(true);
    try {
      const image = await generateWishlistImage(avatarPrompt, apiKey);
      setAvatarImage(image);
    } catch (e) {
      alert("Failed to generate image. Please check your API key and try again.");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePriceThisProduct = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'get_product_info' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              alert("Cannot read this page. Make sure you are on a product page and refresh it.");
              return;
            }
            if (response) {
              const url = chrome.runtime.getURL(`index.html?title=${encodeURIComponent(response.title)}&price=${encodeURIComponent(response.price)}&url=${encodeURIComponent(response.url)}`);
              chrome.tabs.create({ url });
            } else {
              alert("Could not detect product info on this page.");
            }
          });
        }
      });
    } else {
      // Web preview fallback
      alert("Extension API not available in web preview. This works when installed in Chrome.");
    }
  };

  if (isPopup) {
    return (
      <div className="w-64 p-6 bg-white flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <Tag className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">SmartPrice SA</h2>
        <p className="text-sm text-gray-500 mb-6">Find cheaper deals for the product you're currently viewing.</p>
        <button 
          onClick={handlePriceThisProduct}
          className="w-full bg-emerald-600 text-white font-medium py-3 rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Search className="w-5 h-5" /> Price This Product
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">SmartPrice SA</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button 
          onClick={() => setActiveTab('deals')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'deals' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ShoppingCart className="w-4 h-4" /> Deals
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'analytics' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <BarChart3 className="w-4 h-4" /> Analytics
        </button>
        <button 
          onClick={() => setActiveTab('avatar')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'avatar' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ImageIcon className="w-4 h-4" /> Avatar
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
        {activeTab === 'deals' && (
          <div className="space-y-6">
            {currentProduct && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Currently Viewing</h2>
                <p className="font-medium text-gray-900 line-clamp-2">{currentProduct.title}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{currentProduct.price}</p>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                <p className="font-medium">Finding better deals in South Africa...</p>
              </div>
            ) : deals.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alternative Deals</h2>
                {deals.map((deal, idx) => {
                  const currentPrice = currentProduct ? parseFloat(currentProduct.price.replace(/[^0-9.]/g, '')) : 0;
                  const savings = Math.max(0, currentPrice - deal.price);
                  const isCheaper = savings > 0;

                  return (
                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 transition-transform hover:-translate-y-1 hover:shadow-md">
                      <div className="flex gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {deal.image && deal.image.startsWith('http') ? (
                            <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <ShoppingCart className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm line-clamp-2">{deal.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-lg font-bold text-gray-900">R {deal.price}</p>
                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-md text-gray-600">{deal.store}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        {isCheaper ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                            Save R {savings.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-gray-500">Similar Price</span>
                        )}
                        
                        <button 
                          onClick={() => handleDealClick(deal)}
                          className="text-sm font-semibold bg-emerald-600 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-700 flex items-center gap-1 transition-colors"
                        >
                          View Deal <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                <p>No alternative deals found.</p>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-6">
              <AlertCircle className="w-3 h-3" />
              <p>We may earn a commission from some links</p>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <h2 className="text-sm font-medium text-gray-500 mb-1">Total Deal Clicks</h2>
              <p className="text-4xl font-bold text-emerald-600">{stats?.totalClicks || 0}</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Clicks by Store</h2>
              {stats?.storeClicks && Object.keys(stats.storeClicks).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.storeClicks).map(([store, count]) => (
                    <div key={store} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{store}</span>
                      <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded-md">{count as number}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No click data yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'avatar' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Generate Deal Avatar</h2>
              <p className="text-xs text-gray-500 mb-4">Create a custom avatar or product mockup using Gemini 3.1 Flash Image.</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Gemini API Key</label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Required for image generation. Key is not stored.</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prompt</label>
                  <textarea 
                    value={avatarPrompt}
                    onChange={(e) => setAvatarPrompt(e.target.value)}
                    placeholder="A futuristic shopping cart filled with glowing electronics..."
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[80px]"
                  />
                </div>
                
                <button 
                  onClick={handleGenerateAvatar}
                  disabled={avatarLoading || !avatarPrompt.trim()}
                  className="w-full bg-emerald-600 text-white font-medium py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {avatarLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><ImageIcon className="w-4 h-4" /> Generate Image</>
                  )}
                </button>
              </div>
            </div>
            
            {avatarImage && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Result</h2>
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img src={avatarImage} alt="Generated avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
