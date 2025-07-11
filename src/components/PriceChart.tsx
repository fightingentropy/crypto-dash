'use client';

import { useState } from 'react';
import { usePriceChart } from '@/hooks/usePriceChart';
import ChartHeader from './ChartHeader';

// Define valid time range type
type Range = '1D' | '7D' | '1M' | '3M' | '1Y';

function PriceChart({ symbol }: { symbol: string }) {
    const [range, setRange] = useState<Range>('1D');
    const [isLoading, setIsLoading] = useState(true);
    const chartContainerRef = usePriceChart(symbol, range, setIsLoading);

    return (
        <div className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col bg-white dark:bg-gray-800 transition-colors">
            <ChartHeader 
                symbol={symbol}
                range={range}
                setRange={setRange}
            />
            <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 z-10">
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Loading chart...</span>
                        </div>
                    </div>
                )}
                <div ref={chartContainerRef} className="w-full h-96" />
            </div>
        </div>
    );
}

export default PriceChart; 