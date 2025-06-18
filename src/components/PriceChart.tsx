'use client';

import { useState } from 'react';
import { usePriceChart } from '@/hooks/usePriceChart';
import ChartHeader from './ChartHeader';

// Define valid time range type
type Range = '1D' | '7D' | '1M' | '3M' | '1Y';

function PriceChart({ symbol }: { symbol: string }) {
    const [range, setRange] = useState<Range>('1D');
    const chartContainerRef = usePriceChart(symbol, range);

    return (
        <div className="rounded-lg shadow-sm p-6 flex flex-col bg-white">
            <ChartHeader 
                symbol={symbol}
                range={range}
                setRange={setRange}
            />
            <div ref={chartContainerRef} className="w-full h-96" />
        </div>
    );
}

export default PriceChart; 