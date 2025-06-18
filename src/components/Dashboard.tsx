'use client';

import { useState } from 'react';
import PriceChart from '@/components/PriceChart';
import TelegramFeed from '@/components/TelegramFeed';
import CryptoPrices from '@/components/CryptoPrices';
import EconomicIndicators from '@/components/EconomicIndicators';
import ThemeToggle from '@/components/ThemeToggle';
import EthTxVolumeChart from '@/components/EthTxVolumeChart';

export default function Dashboard() {
    const [symbol, setSymbol] = useState('HYPE');

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Entropy Dashboard</h1>
                    <ThemeToggle />
                </div>
            </header>
            <main className="p-4 sm:p-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-8">
                        <CryptoPrices onSymbolClick={setSymbol} />
                        <EconomicIndicators />
                        <EthTxVolumeChart />
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