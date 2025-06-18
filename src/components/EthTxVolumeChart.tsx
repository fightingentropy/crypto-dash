'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import ChartHeader from './ChartHeader';

type Range = '1D' | '7D' | '1M' | '3M' | '1Y';

interface VolumePoint { time: UTCTimestamp; value: number; }

export default function EthTxVolumeChart() {
  const [range, setRange] = useState<Range>('1M');
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chartInstance = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: { textColor: '#1C1C22', background: { color: '#ffffff' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });
    series.current = chartInstance.addLineSeries({ color: '#3b82f6' });
    chart.current = chartInstance;

    const handleResize = () => {
      if (containerRef.current && chart.current) {
        chart.current.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.remove();
    };
  }, []);

  useEffect(() => {
    const map: Record<Range, number> = { '1D': 1, '7D': 7, '1M': 30, '3M': 90, '1Y': 365 };
    const days = map[range] ?? 30;
    setLoading(true);
    fetch(`/api/ethereum-volume?days=${days}`)
      .then(res => res.json())
      .then((data: { date: string; value: number }[]) => {
        const points: VolumePoint[] = data.map(d => ({
          time: (new Date(d.date).getTime() / 1000) as UTCTimestamp,
          value: d.value,
        }));
        series.current?.setData(points);
        chart.current?.timeScale().fitContent();
      })
      .catch(() => { /* silent */ })
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 transition-colors">
      <ChartHeader symbol="ETH Tx Volume" range={range} setRange={setRange} />
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75 z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">Loading chart...</span>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-64" />
      </div>
    </div>
  );
}
