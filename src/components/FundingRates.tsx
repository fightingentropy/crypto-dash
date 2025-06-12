'use client';

import { useEffect, useState } from 'react';

interface FundingRate {
  symbol: string;
  rate: string;
  nextFundingTime: number;
  exchange: string;
}

interface FundingRatesBySymbol {
  [symbol: string]: {
    [exchange: string]: string;
  };
}

export default function FundingRates() {
  const [fundingRates, setFundingRates] = useState<FundingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const fetchFundingRates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/funding');
        if (!response.ok) {
          throw new Error('Failed to fetch funding rates');
        }
        
        const rates = await response.json();
        setFundingRates(rates);
      } catch (e) {
        console.error('Error fetching funding rates:', e);
        setError('Failed to fetch funding rates');
      } finally {
        setLoading(false);
      }
    };

    fetchFundingRates();
    // Refresh every 5 minutes
    const interval = setInterval(fetchFundingRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update 'now' every second for countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Always countdown to the next full hour
  const formatTimeUntilNextHour = () => {
    const date = new Date(now);
    const nextHour = new Date(date);
    nextHour.setMinutes(0, 0, 0);
    nextHour.setHours(date.getMinutes() === 0 && date.getSeconds() === 0 ? date.getHours() : date.getHours() + 1);
    const diff = nextHour.getTime() - now;
    if (diff <= 0) return 'Now';
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m`;
  };

  // Organize data by symbol and exchange
  const organizeData = (): FundingRatesBySymbol => {
    const organized: FundingRatesBySymbol = {};
    
    fundingRates.forEach(rate => {
      if (!organized[rate.symbol]) {
        organized[rate.symbol] = {};
      }
      organized[rate.symbol][rate.exchange] = rate.rate;
    });
    
    return organized;
  };

  if (loading) {
    return (
      <div className="bg-[#181A20] rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-[#F0F3FA] mb-4">(APR)</h2>
        <div className="text-[#F0F3FA]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#181A20] rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-[#F0F3FA] mb-4">(APR)</h2>
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  const organizedData = organizeData();
  const symbols = ['BTC', 'ETH', 'HYPE'];
  const exchanges = ['Binance', 'Hyperliquid'];
  const nextFundingCountdown = formatTimeUntilNextHour();

  return (
    <div className="bg-[#181A20] rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-[#F0F3FA] mb-4">Funding Rates (APR)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-[#F0F3FA]">
          <thead>
            <tr className="border-b border-[#22252B]">
              <th className="text-left py-2">Symbol</th>
              {exchanges.map(exchange => (
                <th key={exchange} className="text-right py-2">{exchange}</th>
              ))}
              <th className="text-right py-2">Next Funding</th>
            </tr>
          </thead>
          <tbody>
            {symbols.map(symbol => (
              <tr key={symbol} className="border-b border-[#22252B]/50">
                <td className="py-3 font-medium">{symbol}</td>
                {exchanges.map(exchange => {
                  const rate = organizedData[symbol]?.[exchange];
                  return (
                    <td key={exchange} className={`py-3 text-right font-mono ${
                      rate && parseFloat(rate) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {rate ? `${parseFloat(rate) >= 0 ? '+' : ''}${rate}%` : '-'}
                    </td>
                  );
                })}
                <td className="py-3 text-right text-gray-400">
                  {nextFundingCountdown}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 