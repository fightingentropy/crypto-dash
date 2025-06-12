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
          // Handle both timestamp formats properly
          const timestamp = typeof time === 'number' ? time : Number(time);
          // If timestamp is in seconds, convert to milliseconds
          const timeInMs = timestamp > 1e10 ? timestamp : timestamp * 1000;
          const date = new Date(timeInMs);
          
          // Check if date is valid
          if (isNaN(date.getTime())) {
            return '00:00';
          }
          
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
        
        if (data.length === 0) {
          setError('No historical data available.');
          return;
        }
        
        let formatted: CandlestickData[] = [];
        if (symbol.toUpperCase() === 'HYPE') {
          // Hyperliquid format: [{ T, c, h, l, o, t, ... }]
          formatted = data.map((d: { t: number; o: string; h: string; l: string; c: string }) => {
            const time = d.t / 1000; // Convert milliseconds to seconds
            const open = parseFloat(d.o);
            const high = parseFloat(d.h);
            const low = parseFloat(d.l);
            const close = parseFloat(d.c);
            
            // Validate the data
            if (isNaN(time) || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
              return null;
            }
            
            return {
              time: time as Time,
              open,
              high,
              low,
              close,
            };
          }).filter(Boolean) as CandlestickData[]; // Remove null values
        } else {
          // Binance format: [[time, open, high, low, close, ...], ...]
          formatted = data.map((d: [number, string, string, string, string]) => {
            const time = d[0] / 1000; // Convert milliseconds to seconds
            const open = parseFloat(d[1]);
            const high = parseFloat(d[2]);
            const low = parseFloat(d[3]);
            const close = parseFloat(d[4]);
            
            // Validate the data
            if (isNaN(time) || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
              return null;
            }
            
            return {
              time: time as Time,
              open,
              high,
              low,
              close,
            };
          }).filter(Boolean) as CandlestickData[]; // Remove null values
        }
        
        // Validate we have valid formatted data
        if (formatted.length === 0) {
          setError('No valid candle data available.');
          return;
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
      .catch((error) => {
        setError('Failed to fetch historical data.');
      });

    // WebSocket connection for real-time data
    let ws: WebSocket | null = null;
    if (symbol.toUpperCase() === 'BTC') {
      ws = new WebSocket('wss://stream.binance.com:9443/ws');
    ws.onopen = () => {
        ws!.send(JSON.stringify({
        method: 'SUBSCRIBE',
          params: [`btcusdt@kline_1h`],
        id: 1
      }));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.k) {
        const time = data.k.t / 1000; // Convert milliseconds to seconds
        const open = parseFloat(data.k.o);
        const high = parseFloat(data.k.h);
        const low = parseFloat(data.k.l);
        const close = parseFloat(data.k.c);
        
        // Validate the real-time data
        if (!isNaN(time) && !isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
          const candle: CandlestickData = {
            time: time as Time,
            open,
            high,
            low,
            close
          };
          candlestickSeries.update(candle);
          setPrice(candle.close);
          setPriceChange(((candle.close - candle.open) / candle.open) * 100);
        }
      }
    };
    } else if (symbol.toUpperCase() === 'HYPE') {
      ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
      ws.onopen = () => {
        ws!.send(JSON.stringify({
          method: 'subscribe',
          subscription: {
            type: 'candle',
            coin: 'HYPE',
            interval: '1h'
          }
        }));
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.data && data.data.s === 'HYPE') {
          const time = data.data.t / 1000; // Convert milliseconds to seconds
          const open = parseFloat(data.data.o);
          const high = parseFloat(data.data.h);
          const low = parseFloat(data.data.l);
          const close = parseFloat(data.data.c);
          
          // Validate the real-time data
          if (!isNaN(time) && !isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
            const candle: CandlestickData = {
              time: time as Time,
              open,
              high,
              low,
              close
            };
            candlestickSeries.update(candle);
            setPrice(candle.close);
            setPriceChange(((candle.close - candle.open) / candle.open) * 100);
          }
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