'use client';

type Range = '1D' | '7D' | '1M' | '3M' | '1Y';
type Theme = 'light' | 'dark';

interface ChartHeaderProps {
    symbol: string;
    range: Range;
    setRange: (range: Range) => void;
    theme: Theme;
    toggleTheme: () => void;
}

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


export default function ChartHeader({ symbol, range, setRange, theme, toggleTheme }: ChartHeaderProps) {
    return (
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className={`text-xl font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Price Charts</h2>
                <h3 className="text-base font-medium text-gray-500">{symbol} Chart</h3>
            </div>
            <div className="flex items-center gap-2">
                {(['1D', '7D', '1M', '3M', '1Y'] as Range[]).map((r) => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                            range === r
                                ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                        }`}
                    >
                        {r}
                    </button>
                ))}
                <button onClick={toggleTheme} className="p-1.5 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
            </div>
        </div>
    );
} 