'use client';

import { useState } from 'react';
import { usePriceChart } from '@/hooks/usePriceChart';
import ChartHeader from './ChartHeader';

// Define valid time range type
type Range = '1D' | '7D' | '1M' | '3M' | '1Y';
type Theme = 'light' | 'dark';

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

function PriceChart({ symbol }: { symbol: string }) {
    const [theme, setTheme] = useState<Theme>('light');
    const [range, setRange] = useState<Range>('1D');
    
    const chartContainerRef = usePriceChart(symbol, range, theme);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <div className={`rounded-lg shadow-sm p-6 flex flex-col ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C22]'}`}>
            <ChartHeader 
                symbol={symbol}
                range={range}
                setRange={setRange}
                theme={theme}
                toggleTheme={toggleTheme}
            />
            <div ref={chartContainerRef} className="w-full h-96" />
        </div>
    );
}

export default PriceChart; 