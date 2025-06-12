'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickData, Time } from 'lightweight-charts';

interface PriceChartProps {
  symbol: string;
}

export default function PriceChart({ symbol }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#181A20' },
        textColor: '#F0F3FA',
      },
      grid: {
        vertLines: { color: '#22252B' },
        horzLines: { color: '#22252B' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: Time) => {
          const date = new Date(Number(time) * 1000);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        },
        fixLeftEdge: true,
        fixRightEdge: true,
        borderVisible: false,
        minimumHeight: 40,
        ticksVisible: true,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceLineVisible: true,
    });

    // Fetch historical data from local API route
    fetch(`/api/binance?symbol=${symbol}`)
      .then(res => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setError(data?.error || 'No data found for this symbol.');
          return;
        }
        let formatted: CandlestickData[] = [];
        if (symbol.toUpperCase() === 'HYPE') {
          // Hyperliquid format: [{ T, c, h, l, o, t, ... }]
          formatted = data.map((d: { t: number; o: string; h: string; l: string; c: string }) => ({
            time: d.t / 1000 as Time,
            open: parseFloat(d.o),
            high: parseFloat(d.h),
            low: parseFloat(d.l),
            close: parseFloat(d.c),
          }));
        } else {
          // Binance format: [[time, open, high, low, close, ...], ...]
          formatted = data.map((d: [number, string, string, string, string]) => ({
            time: d[0] / 1000 as Time,
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
          }));
        }
        

        candlestickSeries.setData(formatted);
        if (formatted.length > 0) {
          setPrice(formatted[formatted.length - 1].close);
          setPriceChange(((formatted[formatted.length - 1].close - formatted[0].open) / formatted[0].open) * 100);
        }
        
        // Show only the last 7 days (168 hours) for better time scale readability
        if (formatted.length > 168) {
          const recentData = formatted.slice(-168);
          candlestickSeries.setData(recentData);
          
          // Set visible range to show last 24 hours for better time label distribution
          const lastTime = recentData[recentData.length - 1].time;
          const firstVisibleTime = Number(lastTime) - (24 * 60 * 60); // 24 hours ago
          chart.timeScale().setVisibleRange({
            from: firstVisibleTime as Time,
            to: lastTime
          });
          
          // Also set logical range to encourage more frequent labels
          chart.timeScale().setVisibleLogicalRange({
            from: 0,
            to: 24
          });
        } else {
          // Fit the chart to show the latest data
          chart.timeScale().fitContent();
        }
        
        // Fit the chart to show the latest data
        chart.timeScale().scrollToRealTime();
      })
      .catch(() => setError('Failed to fetch historical data.'));

    // WebSocket connection for real-time data
    let ws: WebSocket | null = null;
    if (symbol.toUpperCase() === 'BTC' || symbol.toUpperCase() === 'HYPE') {
      ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
      ws.onopen = () => {
        ws!.send(JSON.stringify({
          method: 'subscribe',
          subscription: {
            type: 'candle',
            coin: symbol.toUpperCase(),
            interval: '1h'
          }
        }));
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.data && data.data.s === symbol.toUpperCase()) {
          const candle: CandlestickData = {
            time: data.data.t / 1000 as Time,
            open: parseFloat(data.data.o),
            high: parseFloat(data.data.h),
            low: parseFloat(data.data.l),
            close: parseFloat(data.data.c)
          };
          candlestickSeries.update(candle);
          setPrice(candle.close);
          setPriceChange(((candle.close - candle.open) / candle.open) * 100);
        }
      };
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ws) ws.close();
      chart.remove();
    };
  }, [symbol]);

  return (
    <div className="bg-[#181A20] rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#F0F3FA]">
          {symbol === 'BTC' ? 'BTC-PERP' : symbol === 'HYPE' ? 'HYPE-PERP' : `${symbol}/USDT`}
        </h2>
        <div className="text-right">
          <div className="text-lg font-medium text-[#F0F3FA]">
            {price ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Loading...'}
          </div>
          <div className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </div>
        </div>
      </div>
      {error ? (
        <div className="text-red-400 text-center py-8">{error}</div>
      ) : (
      <div ref={chartContainerRef} className="w-full" />
      )}
    </div>
  );
} 