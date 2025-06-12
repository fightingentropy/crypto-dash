'use client';

import { useEffect, useState } from 'react';
import PriceChart from '@/components/PriceChart';
import FundingRates from '@/components/FundingRates';
import CryptoTweets from '@/components/CryptoTweets';
import TelegramFeed from '@/components/TelegramFeed';

export default function Home() {
  const [_hypePrice, setHypePrice] = useState<string | null>(null);

  useEffect(() => {
    const fetchHypePrice = async () => {
      try {
        const response = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'allMids'
          })
        });
        const data = await response.json();
        if (data.HYPE) {
          const price = parseFloat(data.HYPE).toFixed(2);
          setHypePrice(price);
          document.title = `$${price} HYPE - Crypto Dashboard`;
        }
      } catch (error) {
        console.error('Error fetching HYPE price:', error);
      }
    };

    // Fetch price immediately
    fetchHypePrice();
    
    // Update price every 10 seconds
    const interval = setInterval(fetchHypePrice, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* <h1 className="text-3xl font-bold text-center mb-8">Crypto Price Charts</h1> */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PriceChart symbol="BTC" />
          <PriceChart symbol="HYPE" />
        </div>
        <FundingRates />
        <TelegramFeed />
        <CryptoTweets />
      </div>
    </main>
  );
}
