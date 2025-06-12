'use client';

import { useState, useEffect, useCallback } from 'react';

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

export default function TelegramFeed() {
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);

  const fetchChannelInfo = async () => {
    try {
      const response = await fetch('/api/telegram?action=channel_info&channel=mlmonchain');
      const data = await response.json();
      
      if (response.ok) {
        setChannelInfo(data);
      } else {
        setError(data.error || 'Failed to fetch channel info');
      }
    } catch {
      setError('Network error fetching channel info');
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/telegram?action=messages&channel=mlmonchain&limit=${limit}`);
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages.map((msg: TelegramMessage & { date: number }) => ({
          ...msg,
          date: new Date(msg.date * 1000), // Convert Unix timestamp to Date
        })));
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch messages');
      }
    } catch {
      setError('Network error fetching messages');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchChannelInfo();
    fetchMessages();
  }, [fetchMessages]);

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h3 className="text-red-400 font-semibold mb-2">Telegram Connection Error</h3>
        <p className="text-red-300 text-sm mb-4">{error}</p>
        <div className="text-xs text-red-200">
          <p>To use Telegram integration, you need to:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Get API credentials from <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="underline">my.telegram.org/apps</a></li>
            <li>Add them to your .env.local file</li>
            <li>Complete the authentication process</li>
          </ol>
        </div>
        <button 
          onClick={fetchMessages}
          className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#181A20] border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#F0F3FA] mb-2">
            {channelInfo ? `@${channelInfo.username}` : '@mlmonchain'}
          </h2>
          {channelInfo && (
            <div className="text-sm text-gray-400">
              <p className="font-medium text-[#F0F3FA]">{channelInfo.title}</p>
              <p>{channelInfo.participantsCount?.toLocaleString()} subscribers</p>
              {channelInfo.about && <p className="mt-1 text-xs">{channelInfo.about}</p>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="limit" className="text-sm text-gray-400">Show:</label>
          <select
            id="limit"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="bg-gray-800 border border-gray-600 text-[#F0F3FA] text-sm rounded px-2 py-1"
          >
            <option value={5}>5 messages</option>
            <option value={10}>10 messages</option>
            <option value={20}>20 messages</option>
            <option value={50}>50 messages</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F0F3FA]"></div>
          <span className="ml-3 text-gray-400">Loading messages...</span>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No messages found</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs text-gray-400">
                    Message #{message.id} • {formatDate(message.date)}
                  </div>
                  {message.views && (
                    <div className="text-xs text-gray-500">
                      {message.views.toLocaleString()} views
                    </div>
                  )}
                </div>
                <div className="text-[#F0F3FA] text-sm leading-relaxed">
                  {message.text || <em className="text-gray-500">Media message</em>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh Messages'}
        </button>
      </div>
    </div>
  );
} 