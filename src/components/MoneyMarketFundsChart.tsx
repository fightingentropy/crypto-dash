'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, LineStyle, LineData } from 'lightweight-charts';

interface MMFDataPoint {
  date: string;
  value: number;
}

interface MMFResponse {
  data: MMFDataPoint[];
  title: string;
  unit: string;
  description: string;
}

type Range = '1Y' | '3Y' | '5Y' | '10Y';

export default function MoneyMarketFundsChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const lineSeries = useRef<ISeriesApi<'Line'> | null>(null);
  const [range, setRange] = useState<Range>('5Y');
  const [isLoading, setIsLoading] = useState(true);
  const [mmfData, setMMFData] = useState<MMFResponse | null>(null);

  // Function to get theme colors
  const getThemeColors = () => {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      background: isDark ? '#1f2937' : '#FFFFFF',
      textColor: isDark ? '#f9fafb' : '#1C1C22',
      gridColor: isDark ? '#374151' : '#f3f4f6',
      crosshairColor: isDark ? '#6b7280' : '#9B9B9B',
    };
  };

  // Chart Initialization & Theme
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const colors = getThemeColors();

    const chartInstance = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: colors.background },
        textColor: colors.textColor,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: false,
        borderColor: colors.gridColor,
        tickMarkFormatter: (time: UTCTimestamp) => {
          const date = new Date(time * 1000);
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          const year = date.getFullYear();
          return `Q${quarter} ${year}`;
        },
      },
      rightPriceScale: {
        borderVisible: false,
        borderColor: colors.gridColor,
      },
      crosshair: {
        horzLine: { visible: false, labelVisible: false },
        vertLine: { style: LineStyle.Dashed, color: colors.crosshairColor }
      },
      grid: {
        vertLines: { color: colors.gridColor, visible: true },
        horzLines: { color: colors.gridColor, visible: true }
      },
      handleScroll: true,
      handleScale: true,
      watermark: { visible: false },
    });

    chart.current = chartInstance;

    lineSeries.current = chartInstance.addLineSeries({
      color: '#10b981', // Emerald-500
      lineWidth: 2,
    });

    // Listen for theme changes
    const updateChartTheme = () => {
      if (chart.current) {
        const newColors = getThemeColors();
        chart.current.applyOptions({
          layout: {
            background: { color: newColors.background },
            textColor: newColors.textColor,
          },
          timeScale: {
            borderColor: newColors.gridColor,
          },
          rightPriceScale: {
            borderColor: newColors.gridColor,
          },
          crosshair: {
            vertLine: { color: newColors.crosshairColor }
          },
          grid: {
            vertLines: { color: newColors.gridColor },
            horzLines: { color: newColors.gridColor }
          },
        });
      }
    };

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      updateChartTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.resize(chartContainerRef.current.clientWidth, chartContainerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      chart.current?.remove();
    };
  }, []);

  // Data Fetching with daily caching
  useEffect(() => {
    if (!lineSeries.current || !chart.current) return;

    const fetchMMFData = async () => {
      setIsLoading(true);
      try {
        const years = range === '1Y' ? 1 : range === '3Y' ? 3 : range === '5Y' ? 5 : 10;
        const cacheKey = `mmf-data-${years}y`;
        const cachedDataStr = localStorage.getItem(cacheKey);
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        // Check if we have valid cached data (less than 24 hours old)
        if (cachedDataStr) {
          try {
            const cachedData = JSON.parse(cachedDataStr);
            if (cachedData.timestamp && (now - cachedData.timestamp) < ONE_DAY) {
              // Use cached data
              setMMFData(cachedData.data);
                             const chartData: LineData[] = cachedData.data.data.map((point: MMFDataPoint) => ({
                time: (new Date(point.date).getTime() / 1000) as UTCTimestamp,
                value: point.value,
              }));
              lineSeries.current!.setData(chartData);
              chart.current!.timeScale().fitContent();
              setIsLoading(false);
              return;
            }
          } catch {
            // Invalid cached data, proceed to fetch
          }
        }

        // Fetch fresh data
        const response = await fetch(`/api/money-market-funds?years=${years}`);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data: MMFResponse = await response.json();
        setMMFData(data);

        // Cache the data with timestamp
        localStorage.setItem(cacheKey, JSON.stringify({
          data: data,
          timestamp: now
        }));

        // Convert data to chart format
        const chartData: LineData[] = data.data.map(point => ({
          time: (new Date(point.date).getTime() / 1000) as UTCTimestamp,
          value: point.value,
        }));

        lineSeries.current!.setData(chartData);
        chart.current!.timeScale().fitContent();
      } catch {
        // Silently handle errors to keep console clean
      } finally {
        setIsLoading(false);
      }
    };

    fetchMMFData();
  }, [range]);

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}T`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}B`;
    }
    return `$${value.toFixed(0)}M`;
  };

  const getLatestValue = () => {
    if (!mmfData || mmfData.data.length === 0) return null;
    const latest = mmfData.data[mmfData.data.length - 1];
    const date = new Date(latest.date);
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const year = date.getFullYear();
    return {
      value: formatValue(latest.value),
      date: `Q${quarter} ${year}`
    };
  };

  const latestValue = getLatestValue();

  return (
    <div className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col bg-white dark:bg-gray-800 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Money Market Funds</h3>
          {latestValue && (
            <div className="mt-1">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{latestValue.value}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({latestValue.date})</span>
            </div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total Financial Assets, Level
          </p>
        </div>
        
        {/* Range Selector */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['1Y', '3Y', '5Y', '10Y'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                range === r
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">Loading MMF data...</span>
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-80" />
      </div>
    </div>
  );
} 