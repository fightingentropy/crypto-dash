'use client';

import { useState, useEffect } from 'react';

interface Asset {
  name: string;
  price: number;
  volume: number;
  funding: number | null;
}

interface CryptoPricesProps {
    onSymbolClick: (symbol: string) => void;
}

const formatPrice = (price: number) => {
    if (price === 0) return '-';
    if (price < 0.01) return `$${price.toPrecision(2)}`;
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const formatFunding = (funding: number | null) => {
    if (funding === null) return '-';
    return `${(funding * 100).toFixed(4)}%`;
}

export default function CryptoPrices({ onSymbolClick }: CryptoPricesProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch('/api/market-data', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        if (response.ok) {
          setAssets(data);
          // Update tab title with HYPE price
          const hype = data.find((a: Asset) => a.name === 'HYPE');
          if (hype) {
            document.title = `$${hype.price.toFixed(2)} HYPE - Crypto Dashboard`;
          }
        }
      } catch {
        // Silently handle errors - don't log to console to keep it clean
        // Keep existing data if fetch fails
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15 seconds to avoid rate limits
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Crypto Prices</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600">
              <th className="p-2 text-sm font-medium text-gray-500 dark:text-gray-400">Asset</th>
              <th className="p-2 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Mark Price</th>
              <th className="p-2 text-right text-sm font-medium text-gray-500 dark:text-gray-400">24h Volume</th>
              <th className="p-2 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Funding</th>
            </tr>
          </thead>
          <tbody>
            {loading && !assets.length ? (
              <tr><td colSpan={4} className="text-center p-4 text-gray-500 dark:text-gray-400">Loading...</td></tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.name} onClick={() => onSymbolClick(asset.name)} className="border-b last:border-0 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-pointer transition-colors">
                  <td className="p-2 font-semibold text-gray-900 dark:text-white">{asset.name}</td>
                  <td className="p-2 text-right font-mono text-sm">{formatPrice(asset.price)}</td>
                  <td className="p-2 text-right font-mono text-sm">${asset.volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                  <td className={`p-2 text-right font-mono text-sm ${asset.funding && asset.funding > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatFunding(asset.funding)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 