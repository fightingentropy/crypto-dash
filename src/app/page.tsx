'use client';

import PriceChart from '@/components/PriceChart';
import FundingRates from '@/components/FundingRates';
import CryptoNews from '@/components/CryptoNews';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Crypto Price Charts</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PriceChart symbol="BTC" />
          <PriceChart symbol="HYPE" />
        </div>
        <FundingRates />
        <CryptoNews />
      </div>
    </main>
  );
}
