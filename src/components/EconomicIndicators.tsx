'use client';

import { useState, useEffect } from 'react';

interface Indicator {
  name: string;
  value: string;
  date: string;
}

export default function EconomicIndicators() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/economic-indicators');
        if (response.ok) {
          const data = await response.json();
          setIndicators(data);
        }
      } catch {
        // Silently handle errors to keep console clean
      } finally {
        setLoading(false);
      }
    };
    
    fetchIndicators();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Economic Indicators</h2>
        <div className="space-y-4">
          <p className="text-gray-500 dark:text-gray-400">Loading economic indicators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Economic Indicators</h2>
      <div className="space-y-4">
        {indicators.length ? (
          indicators.map(indicator => (
            <div key={indicator.name} className="flex justify-between items-baseline">
              <span className="text-gray-700 dark:text-gray-300">{indicator.name}</span>
              <span className="font-mono text-lg font-semibold text-gray-900 dark:text-white">
                {indicator.value}
                <span className="text-sm font-normal ml-2 text-gray-600 dark:text-gray-400">({indicator.date})</span>
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No valid upcoming economic events found.</p>
        )}
      </div>
    </div>
  );
}
