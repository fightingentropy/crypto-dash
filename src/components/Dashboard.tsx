'use client';

import { useState } from 'react';
import PriceChart from '@/components/PriceChart';
import TelegramFeed from '@/components/TelegramFeed';
import CryptoPrices from '@/components/CryptoPrices';
import EconomicIndicators from '@/components/EconomicIndicators';

export default function Dashboard() {
    const [symbol, setSymbol] = useState('HYPE');

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">Entropy Dashboard</h1>
                </div>
            </header>
            <main className="p-4 sm:p-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-8">
                        <CryptoPrices onSymbolClick={setSymbol} />
                        <EconomicIndicators />
                    </div>
                    {/* Right Column */}
                    <div className="space-y-8">
                        <PriceChart symbol={symbol} />
                        <TelegramFeed />
                    </div>
                </div>
            </main>
        </div>
    );
} 