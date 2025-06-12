'use client';

import { useEffect, useState, useCallback } from 'react';

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

export default function CryptoTweets() {
  const [tweets, setTweets] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  const fetchTweets = useCallback(async () => {
    // Don't fetch if we have recent data (less than 5 minutes old)
    if (lastUpdate && Date.now() - lastUpdate.getTime() < 5 * 60 * 1000) {
      return;
    }

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
      
      const tweetsData = await response.json();
      setTweets(tweetsData);
      setLastUpdate(new Date());
      setRateLimited(false);
    } catch {
      setError('Failed to load tweets from @TreeNewsFeed');
    } finally {
      setLoading(false);
    }
  }, [lastUpdate]);

  useEffect(() => {
    // Only fetch on initial page load, no automatic polling
    fetchTweets();
  }, [fetchTweets]);

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
        <h2 className="text-xl font-semibold text-[#F0F3FA] mb-4">Latest Crypto Tweets</h2>
        <div className="text-[#F0F3FA]">Loading tweets from @TreeNewsFeed...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#181A20] rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-[#F0F3FA] mb-4">Latest Crypto Tweets</h2>
        <div className="mb-4 p-3 rounded text-sm bg-red-900/20 border border-red-600/30 text-red-400">
          {error}
        </div>
        <button
          onClick={fetchTweets}
          disabled={loading}
          className="text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-500"
        >
          {loading ? 'Loading...' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#181A20] rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#F0F3FA]">Latest Crypto Tweets</h2>
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
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {tweets.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No tweets available</p>
        ) : (
          tweets.map((item) => (
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
          ))
        )}
      </div>
    </div>
  );
} 