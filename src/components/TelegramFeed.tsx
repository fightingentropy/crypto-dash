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
        // API returns an array directly, not { messages: [...] }
        const messagesArray = Array.isArray(data) ? data : data.messages || [];
        setMessages(messagesArray.map((msg: { id: number; message?: string; date: number; sender?: string; views?: number }) => ({
          id: msg.id,
          text: msg.message || '',
          date: new Date(msg.date * 1000), // Convert Unix timestamp to Date
          sender: msg.sender || 'Channel',
          views: msg.views || 0
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
    return null;
  }

  return (
    <div className="bg-[#181A20] border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[#F0F3FA]">
          {channelInfo ? `@${channelInfo.username}` : '@mlmonchain'}
        </h2>
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
            onClick={fetchMessages}
            disabled={loading}
            className="text-gray-400 hover:text-[#F0F3FA] disabled:text-gray-600 transition-colors"
            title="Refresh messages"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
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

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F0F3FA]"></div>
          <span className="ml-2 text-gray-400 text-sm">Loading...</span>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center py-3 text-sm">No messages found</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className="bg-gray-800/50 border border-gray-700 rounded p-3 hover:bg-gray-800/70 transition-colors"
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
                <div className="text-[#F0F3FA] text-sm leading-relaxed">
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