'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TelegramMessage {
  id: number;
  text: string;
  date: Date;
  sender: string;
  views?: number;
}

interface ChannelInfo {
  id: string;
  title: string;
  username: string;
  participantsCount: number;
  about?: string;
}

interface ChannelData {
  messages: TelegramMessage[];
  channelInfo: ChannelInfo | null;
  loading: boolean;
  error: string | null;
}

const CHANNELS = [
  { id: 'mlmonchain', name: '@mlmonchain', displayName: 'ML MonChain' },
  { id: 'infinityhedge', name: '@infinityhedge', displayName: 'Infinity Hedge' }
];

// Cache for Telegram data with longer 15-minute expiry to prevent rate limiting
const channelInfoCache = new Map<string, { data: ChannelInfo, timestamp: number }>();
const messagesCache = new Map<string, { data: TelegramMessage[], timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Rate limiting - track last request time per channel
const lastRequestTime = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 10000; // 10 seconds minimum between requests

export default function TelegramFeed() {
  const [activeChannel, setActiveChannel] = useState('mlmonchain');
  const [limit, setLimit] = useState(10);
  const [channelData, setChannelData] = useState<Record<string, ChannelData>>({
    mlmonchain: { messages: [], channelInfo: null, loading: false, error: null },
    infinityhedge: { messages: [], channelInfo: null, loading: false, error: null }
  });

  const fetchChannelInfo = useCallback(async (channelId: string) => {
    const cacheKey = `channelInfo-${channelId}`;
    const cached = channelInfoCache.get(cacheKey);
    const now = Date.now();

    // Use cached data if it's less than 15 minutes old
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setChannelData(prev => ({
        ...prev,
        [channelId]: {
          ...prev[channelId],
          channelInfo: cached.data,
          error: null
        }
      }));
      return;
    }

    // Rate limiting - check if we've made a request too recently
    const lastRequest = lastRequestTime.get(`channelInfo-${channelId}`) || 0;
    if (now - lastRequest < MIN_REQUEST_INTERVAL) {
      return; // Skip this request to avoid rate limiting
    }
    lastRequestTime.set(`channelInfo-${channelId}`, now);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`/api/telegram?action=channel_info&channel=${channelId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (response.ok) {
        // Cache the successful response
        channelInfoCache.set(cacheKey, { data, timestamp: now });
        
        setChannelData(prev => ({
          ...prev,
          [channelId]: {
            ...prev[channelId],
            channelInfo: data,
            error: null
          }
        }));
      } else {
        setChannelData(prev => ({
          ...prev,
          [channelId]: {
            ...prev[channelId],
            error: data.error || 'Failed to fetch channel info'
          }
        }));
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted due to timeout - hide component
        setChannelData(prev => ({
          ...prev,
          [channelId]: {
            ...prev[channelId],
            error: 'Request timeout'
          }
        }));
      } else {
        // Other errors - hide component
        setChannelData(prev => ({
          ...prev,
          [channelId]: {
            ...prev[channelId],
            error: 'Service unavailable'
          }
        }));
      }
    }
  }, []);

  const fetchMessages = useCallback(async (channelId: string) => {
    const cacheKey = `messages-${channelId}-${limit}`;
    const cached = messagesCache.get(cacheKey);
    const now = Date.now();

    // Use cached data if it's less than 15 minutes old
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setChannelData(prev => ({
        ...prev,
        [channelId]: {
          ...prev[channelId],
          messages: cached.data,
          error: null,
          loading: false
        }
      }));
      return;
    }

    // Rate limiting - check if we've made a request too recently
    const lastRequest = lastRequestTime.get(`messages-${channelId}`) || 0;
    if (now - lastRequest < MIN_REQUEST_INTERVAL) {
      return; // Skip this request to avoid rate limiting
    }
    lastRequestTime.set(`messages-${channelId}`, now);

    try {
      setChannelData(prev => ({
        ...prev,
        [channelId]: {
          ...prev[channelId],
          loading: true
        }
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`/api/telegram?action=messages&channel=${channelId}&limit=${limit}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (response.ok) {
        const messagesArray = Array.isArray(data) ? data : data.messages || [];
        const formattedMessages = messagesArray.map((msg: { id: number; message?: string; date: number; sender?: string; views?: number }) => ({
          id: msg.id,
          text: msg.message || '',
          date: new Date(msg.date * 1000),
          sender: msg.sender || 'Channel',
          views: msg.views || 0
        }));

        // Cache the successful response
        messagesCache.set(cacheKey, { data: formattedMessages, timestamp: now });

        setChannelData(prev => ({
          ...prev,
          [channelId]: {
            ...prev[channelId],
            messages: formattedMessages,
            error: null,
            loading: false
          }
        }));
      } else {
        setChannelData(prev => ({
          ...prev,
          [channelId]: {
            ...prev[channelId],
            error: data.error || 'Failed to fetch messages',
            loading: false
          }
        }));
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted due to timeout - hide component
        setChannelData(prev => ({
          ...prev,
          [channelId]: {
            ...prev[channelId],
            error: 'Request timeout',
            loading: false
          }
        }));
      } else {
        // Other errors - hide component
        setChannelData(prev => ({
          ...prev,
          [channelId]: {
            ...prev[channelId],
            error: 'Service unavailable',
            loading: false
          }
        }));
      }
    }
  }, [limit]);

  const refreshActiveChannel = () => {
    // Check rate limiting before allowing refresh
    const now = Date.now();
    const lastRefresh = lastRequestTime.get(`refresh-${activeChannel}`) || 0;
    if (now - lastRefresh < MIN_REQUEST_INTERVAL) {
      return; // Prevent spamming refresh button
    }
    lastRequestTime.set(`refresh-${activeChannel}`, now);

    // Clear cache for this channel and refetch
    const cacheKeyInfo = `channelInfo-${activeChannel}`;
    const cacheKeyMessages = `messages-${activeChannel}-${limit}`;
    channelInfoCache.delete(cacheKeyInfo);
    messagesCache.delete(cacheKeyMessages);
    
    // Clear fetch tracking so we can refetch
    const fetchKey = `${activeChannel}-${limit}`;
    hasFetchedRef.current.delete(fetchKey);
    
    const current = channelData[activeChannel];
    if (!current.loading) {
      fetchChannelInfo(activeChannel);
      fetchMessages(activeChannel);
    }
  };

  // Fetch data only when a channel is viewed for the first time or has no cached data
  const hasFetchedRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const current = channelData[activeChannel];
    const now = Date.now();
    const fetchKey = `${activeChannel}-${limit}`;
    
    // Skip if we've already attempted to fetch for this channel/limit combination
    if (hasFetchedRef.current.has(fetchKey)) {
      return;
    }
    
    // Check if we have recent cached data first
    const cacheKeyInfo = `channelInfo-${activeChannel}`;
    const cacheKeyMessages = `messages-${activeChannel}-${limit}`;
    const cachedInfo = channelInfoCache.get(cacheKeyInfo);
    const cachedMessages = messagesCache.get(cacheKeyMessages);
    
    const hasRecentCache = (cachedInfo && (now - cachedInfo.timestamp) < CACHE_DURATION) ||
                          (cachedMessages && (now - cachedMessages.timestamp) < CACHE_DURATION);
    
    // Only fetch if no data exists AND no recent cache AND not currently loading AND no errors
    if (!hasRecentCache && current.messages.length === 0 && !current.loading && !current.error) {
      hasFetchedRef.current.add(fetchKey);
      fetchChannelInfo(activeChannel);
      fetchMessages(activeChannel);
    }
  }, [activeChannel, limit, fetchChannelInfo, fetchMessages]);

  // Refetch messages only when the limit changes, skipping the initial render
  const isInitialMount = useRef(true);
  const lastLimitRef = useRef(limit);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastLimitRef.current = limit;
      return;
    }

    // Only proceed if limit actually changed
    if (lastLimitRef.current === limit) {
      return;
    }
    lastLimitRef.current = limit;

    // Check if we have recent cached data for this limit
    const cacheKey = `messages-${activeChannel}-${limit}`;
    const cached = messagesCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      // Use cached data instead of fetching
      setChannelData(prev => ({
        ...prev,
        [activeChannel]: {
          ...prev[activeChannel],
          messages: cached.data,
          error: null,
          loading: false
        }
      }));
      return;
    }

    // Check rate limiting
    const lastRequest = lastRequestTime.get(`messages-${activeChannel}`) || 0;
    if (now - lastRequest < MIN_REQUEST_INTERVAL) {
      return; // Skip this request to avoid rate limiting
    }
    
    const current = channelData[activeChannel];
    if (!current.loading) {
      fetchMessages(activeChannel);
    }
  }, [limit, activeChannel, fetchMessages]);

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentChannelData = channelData[activeChannel];

  // If there's an error with the current channel, don't show anything
  if (currentChannelData.error) {
    return null;
  }

  // If all channels have errors, don't show the component at all
  const allChannelsHaveErrors = Object.values(channelData).every(data => data.error);
  if (allChannelsHaveErrors) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Channel Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-gray-800 rounded-lg p-1">
          {CHANNELS.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeChannel === channel.id
                  ? 'bg-[#F0F3FA] text-gray-900'
                  : 'text-gray-400 hover:text-[#F0F3FA]'
              }`}
            >
              {channel.displayName}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="bg-gray-800 border border-gray-600 text-[#F0F3FA] text-xs rounded px-2 py-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button
            onClick={refreshActiveChannel}
            disabled={currentChannelData.loading}
            className="text-gray-400 hover:text-[#F0F3FA] disabled:text-gray-600 transition-colors"
            title="Refresh messages"
          >
            <svg
              className={`w-4 h-4 ${currentChannelData.loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      {currentChannelData.loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-500 text-sm">Loading...</span>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {currentChannelData.messages.length === 0 ? (
            <p className="text-gray-500 text-center py-3 text-sm">No messages found</p>
          ) : (
            currentChannelData.messages.map((message) => (
              <div
                key={message.id}
                className="bg-gray-50 border border-gray-200 rounded p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs text-gray-500">
                    #{message.id} • {formatDate(message.date)}
                  </div>
                  {message.views && (
                    <div className="text-xs text-gray-500">
                      {message.views.toLocaleString()} views
                    </div>
                  )}
                </div>
                <div className="text-gray-800 text-sm leading-relaxed">
                  {message.text || <em className="text-gray-500">Media message</em>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 