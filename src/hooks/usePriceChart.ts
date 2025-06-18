import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, LineStyle, CandlestickData } from 'lightweight-charts';

type Theme = 'light' | 'dark';
type Range = '1D' | '7D' | '1M' | '3M' | '1Y';

export function usePriceChart(symbol: string, range: Range, theme: Theme) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chart = useRef<IChartApi | null>(null);
    const candlestickSeries = useRef<ISeriesApi<'Candlestick'> | null>(null);

    // Chart Initialization
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chartInstance = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: { timeVisible: true, secondsVisible: false, borderVisible: false },
            rightPriceScale: { borderVisible: false },
            crosshair: { horzLine: { visible: false, labelVisible: false }, vertLine: { style: LineStyle.Dashed } },
            grid: { vertLines: { visible: false }, horzLines: { visible: false } },
            handleScroll: true,
            handleScale: true,
            watermark: { visible: false },
        });
        chart.current = chartInstance;

        candlestickSeries.current = chartInstance.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        const handleResize = () => {
            if (chart.current && chartContainerRef.current) {
                chart.current.resize(chartContainerRef.current.clientWidth, chartContainerRef.current.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.current?.remove();
        };
    }, []);

    // Theme Updates
    useEffect(() => {
        if (!chart.current) return;
        chart.current.applyOptions({
            layout: {
                background: { color: theme === 'light' ? '#FFFFFF' : '#1C1C22' },
                textColor: theme === 'light' ? '#1C1C22' : '#FFFFFF',
            },
            crosshair: {
                vertLine: { color: theme === 'light' ? '#9B9B9B' : '#555' },
            },
        });
    }, [theme]);

    // Data Fetching and Live Feed
    useEffect(() => {
        if (!candlestickSeries.current || !chart.current) return;

        const series = candlestickSeries.current;

        const getCandle = (i: any): CandlestickData => ({
            time: Math.floor(i.t / 1000) as UTCTimestamp,
            open: parseFloat(i.o),
            high: parseFloat(i.h),
            low: parseFloat(i.l),
            close: parseFloat(i.c),
        });

        const fetchHistoricalData = async () => {
            const interval = range === '1D' ? '15m' : range === '7D' ? '1h' : '4h';
            const start = new Date();
            if (range === '7D') start.setDate(start.getDate() - 7);
            else if (range === '1M') start.setMonth(start.getMonth() - 1);
            else if (range === '3M') start.setMonth(start.getMonth() - 3);
            else if (range === '1Y') start.setFullYear(start.getFullYear() - 1);
            else start.setDate(start.getDate() - 1);

            const body = {
                type: 'candleSnapshot',
                req: { coin: symbol, interval, startTime: start.getTime(), endTime: Date.now() },
            };

            try {
                const response = await fetch('https://api.hyperliquid.xyz/info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }
                const data = await response.json();
                if (Array.isArray(data)) {
                    const candles = data.map(getCandle);
                    series.setData(candles);
                    chart.current?.timeScale().fitContent();
                }
            } catch (error) {
                console.error('Error fetching historical data:', error);
            }
        };

        fetchHistoricalData();

        const ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
        ws.onopen = () => {
            ws.send(JSON.stringify({
                method: 'subscribe',
                subscription: { type: 'l2Book', coin: symbol.toUpperCase() }
            }));
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.channel === 'l2Book' && msg.data?.levels?.[0]?.[0]) {
                const price = parseFloat(msg.data.levels[0][0].px);
                const data = series.data();
                const lastCandle = data[data.length - 1] as CandlestickData | undefined;

                if (lastCandle) {
                    series.update({
                        ...lastCandle,
                        close: price,
                        high: Math.max(lastCandle.high, price),
                        low: Math.min(lastCandle.low, price),
                    });
                }
            }
        };

        return () => {
            ws.close();
        };
    }, [symbol, range]);
    
    return chartContainerRef;
} 