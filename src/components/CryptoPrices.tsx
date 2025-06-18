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
        const response = await fetch('/api/market-data');
        const data = await response.json();
        if (response.ok) {
          setAssets(data);
          // Update tab title with HYPE price
          const hype = data.find((a: Asset) => a.name === 'HYPE');
          if (hype) {
            document.title = `$${hype.price.toFixed(2)} HYPE - Crypto Dashboard`;
          }
        }
      } catch (error) {
        console.error('Failed to fetch market data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Crypto Prices</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-sm font-medium text-gray-500">Asset</th>
              <th className="p-2 text-right text-sm font-medium text-gray-500">Mark Price</th>
              <th className="p-2 text-right text-sm font-medium text-gray-500">24h Volume</th>
              <th className="p-2 text-right text-sm font-medium text-gray-500">Funding</th>
            </tr>
          </thead>
          <tbody>
            {loading && !assets.length ? (
              <tr><td colSpan={4} className="text-center p-4 text-gray-500">Loading...</td></tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.name} onClick={() => onSymbolClick(asset.name)} className="border-b last:border-0 border-gray-100 hover:bg-gray-50 text-gray-800 cursor-pointer">
                  <td className="p-2 font-semibold text-gray-900">{asset.name}</td>
                  <td className="p-2 text-right font-mono text-sm">{formatPrice(asset.price)}</td>
                  <td className="p-2 text-right font-mono text-sm">${asset.volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                  <td className={`p-2 text-right font-mono text-sm ${asset.funding && asset.funding > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatFunding(asset.funding)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 