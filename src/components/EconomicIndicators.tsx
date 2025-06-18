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
        const data = await response.json();
        if (response.ok) {
          setIndicators(data);
        }
      } catch (error) {
        console.error('Failed to fetch economic indicators', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIndicators();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-4" style={{color: '#111827'}}>Economic Indicators</h2>
      <div className="space-y-4">
        {loading && !indicators.length ? (
          <p style={{color: '#6B7280'}}>Loading...</p>
        ) : (
          indicators.map(indicator => (
            <div key={indicator.name} className="flex justify-between items-baseline">
              <span style={{color: '#374151'}}>{indicator.name}</span>
              <span className="font-mono text-lg font-semibold" style={{color: '#111827'}}>
                {indicator.value}
                <span className="text-sm font-normal ml-2" style={{color: '#4B5563'}}>({indicator.date})</span>
              </span>
            </div>
          ))
        )}
        {!loading && !indicators.length && (
            <p style={{color: '#6B7280'}}>No valid upcoming economic events found.</p>
        )}
      </div>
    </div>
  );
} 