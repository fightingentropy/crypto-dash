'use client';

import { useEffect, useState } from 'react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  timestamp: number;
  source: string;
  url?: string;
  category?: string;
  metrics?: {
    retweets: number;
    likes: number;
    replies: number;
  };
}

export default function CryptoNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  const fetchTweets = async () => {
    try {
      setError(null);
      const response = await fetch('/api/twitter');
      
      if (response.status === 429) {
        setRateLimited(true);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch tweets');
      }
      
      const tweets = await response.json();
      setNews(tweets);
      setLastUpdate(new Date());
      setRateLimited(false);
    } catch (e) {
      console.error('Error fetching tweets:', e);
      setError('Failed to load tweets. Using fallback news...');
      
      // Fallback to mock data if Twitter API fails
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'Bitcoin Surges Past $107K as Institutional Demand Continues',
          summary: 'Major institutional investors continue accumulating Bitcoin as ETF inflows reach new highs...',
          timestamp: Date.now() - 300000,
          source: 'CoinDesk',
          category: 'Market'
        },
        {
          id: '2',
          title: 'Ethereum Pectra Upgrade Shows Strong Network Performance',
          summary: 'Post-upgrade metrics show improved validator efficiency and increased staking participation...',
          timestamp: Date.now() - 900000,
          source: 'The Block',
          category: 'Technology'
        },
        {
          id: '3',
          title: 'Hyperliquid Trading Volume Reaches New All-Time High',
          summary: 'The decentralized perps exchange processes record $18B in daily volume as HYPE token gains momentum...',
          timestamp: Date.now() - 1800000,
          source: 'DeFi Pulse',
          category: 'DeFi'
        }
      ];
      setNews(mockNews);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch on initial page load
    fetchTweets();
  }, []);

  // Hide component completely if rate limited
  if (rateLimited) {
    return null;
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (hours > 0) {
      return `${hours}h ago`;
    }
    return `${minutes}m ago`;
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Market': return 'text-green-400';
      case 'Technology': return 'text-blue-400';
      case 'DeFi': return 'text-purple-400';
      case 'Regulation': return 'text-yellow-400';
      case 'News': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const formatMetrics = (metrics?: { retweets: number; likes: number; replies: number }) => {
    if (!metrics) return null;
    
    return (
      <div className="flex space-x-3 text-xs text-gray-500">
        <span>💬 {metrics.replies}</span>
        <span>🔄 {metrics.retweets}</span>
        <span>❤️ {metrics.likes}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-[#181A20] rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-[#F0F3FA] mb-4">Latest Crypto News</h2>
        <div className="text-[#F0F3FA]">Loading tweets from @TreeNewsFeed...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#181A20] rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#F0F3FA]">Latest Crypto News</h2>
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Loaded: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchTweets}
            disabled={loading}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-500"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 rounded text-sm bg-red-900/20 border border-red-600/30 text-red-400">
          {error}
        </div>
      )}
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {news.map((item) => (
          <div key={item.id} className="border-b border-[#22252B]/50 pb-4 last:border-b-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[#F0F3FA] font-medium text-sm leading-tight pr-4">
                {item.title}
              </h3>
              <div className="flex flex-col items-end text-xs text-gray-400 whitespace-nowrap">
                <span>{formatTimeAgo(item.timestamp)}</span>
                {item.category && (
                  <span className={`${getCategoryColor(item.category)} mt-1`}>
                    {item.category}
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-2 line-clamp-3">
              {item.summary}
            </p>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span className="text-xs text-gray-500">{item.source}</span>
                {formatMetrics(item.metrics)}
              </div>
              {item.url && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  View Tweet →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-[#22252B]/50">
        <p className="text-xs text-gray-500 text-center">
          Latest tweets from <a href="https://x.com/TreeNewsFeed" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">@TreeNewsFeed</a> • Refresh page for updates
        </p>
      </div>
    </div>
  );
} 