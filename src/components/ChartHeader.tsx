'use client';

type Range = '1D' | '7D' | '1M' | '3M' | '1Y';

interface ChartHeaderProps {
    symbol: string;
    range: Range;
    setRange: (range: Range) => void;
}

export default function ChartHeader({ symbol, range, setRange }: ChartHeaderProps) {
    return (
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Price Charts</h2>
                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">{symbol} Chart</h3>
            </div>
            <div className="flex items-center gap-2">
                {(['1D', '7D', '1M', '3M', '1Y'] as Range[]).map((r) => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                            range === r
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        {r}
                    </button>
                ))}
            </div>
        </div>
    );
} 