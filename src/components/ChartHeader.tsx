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
                <h2 className="text-xl font-semibold text-gray-900">Price Charts</h2>
                <h3 className="text-base font-medium text-gray-500">{symbol} Chart</h3>
            </div>
            <div className="flex items-center gap-2">
                {(['1D', '7D', '1M', '3M', '1Y'] as Range[]).map((r) => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                            range === r
                                ? 'bg-gray-200 text-gray-900'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        {r}
                    </button>
                ))}
            </div>
        </div>
    );
} 