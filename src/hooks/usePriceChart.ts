import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, LineStyle, CandlestickData } from 'lightweight-charts';

type Range = '1D' | '7D' | '1M' | '3M' | '1Y';

// Cache for historical data with 5-minute expiry
const dataCache = new Map<string, { data: CandlestickData[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Track active WebSocket to ensure only one connection at a time
let activeWebSocket: WebSocket | null = null;
let activeSymbol: string | null = null;

export function usePriceChart(symbol: string, range: Range, setIsLoading?: (loading: boolean) => void) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chart = useRef<IChartApi | null>(null);
    const candlestickSeries = useRef<ISeriesApi<'Candlestick'> | null>(null);

    // Function to get theme colors
    const getThemeColors = () => {
        const isDark = document.documentElement.classList.contains('dark');
        return {
            background: isDark ? '#1f2937' : '#FFFFFF', // gray-800 : white
            textColor: isDark ? '#f9fafb' : '#1C1C22',  // gray-50 : dark
            gridColor: isDark ? '#374151' : '#f3f4f6',   // gray-700 : gray-100
            crosshairColor: isDark ? '#6b7280' : '#9B9B9B', // gray-500 : gray-400
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

        candlestickSeries.current = chartInstance.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
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

    // Data Fetching and Live Feed
    useEffect(() => {
        if (!candlestickSeries.current || !chart.current) return;

        const series = candlestickSeries.current;

        const getCandle = (i: { t: number; o: string; h: string; l: string; c: string; }): CandlestickData => ({
            time: Math.floor(i.t / 1000) as UTCTimestamp,
            open: parseFloat(i.o),
            high: parseFloat(i.h),
            low: parseFloat(i.l),
            close: parseFloat(i.c),
        });

        const fetchHistoricalData = async () => {
            setIsLoading?.(true);
            const cacheKey = `${symbol}-${range}`;
            const cached = dataCache.get(cacheKey);
            const now = Date.now();

            // Use cached data if it's less than 5 minutes old
            if (cached && (now - cached.timestamp) < CACHE_DURATION) {
                series.setData(cached.data);
                chart.current?.timeScale().fitContent();
                setIsLoading?.(false);
                return;
            }

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
                // Add timeout to prevent hanging requests
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
                
                const response = await fetch('https://api.hyperliquid.xyz/info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }
                const data = await response.json();
                if (Array.isArray(data)) {
                    const candles = data.map(getCandle);
                    series.setData(candles);
                    chart.current?.timeScale().fitContent();
                    
                    // Cache the data with current timestamp
                    dataCache.set(cacheKey, { data: candles, timestamp: now });
                }
            } catch {
                // Silently handle fetch errors to keep console clean
            } finally {
                setIsLoading?.(false);
            }
        };

        fetchHistoricalData();

        // Close existing WebSocket if it's for a different symbol
        if (activeWebSocket && activeSymbol !== symbol) {
            if (activeWebSocket.readyState === WebSocket.OPEN) {
                activeWebSocket.close();
            }
            activeWebSocket = null;
            activeSymbol = null;
        }

        // Only create WebSocket for this symbol if none exists
        if (!activeWebSocket || activeSymbol !== symbol) {
            const ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
            activeWebSocket = ws;
            activeSymbol = symbol;
            
            ws.onopen = () => {
                ws.send(JSON.stringify({
                    method: 'subscribe',
                    subscription: { type: 'l2Book', coin: symbol.toUpperCase() }
                }));
            };

            ws.onmessage = (event) => {
                // Only process messages if this is still the active symbol
                if (activeSymbol === symbol) {
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
                }
            };

            ws.onerror = () => {
                // Silently handle WebSocket errors to prevent timeout messages
                if (activeWebSocket === ws) {
                    activeWebSocket = null;
                    activeSymbol = null;
                }
            };

            ws.onclose = () => {
                // Silently handle WebSocket closure
                if (activeWebSocket === ws) {
                    activeWebSocket = null;
                    activeSymbol = null;
                }
            };
        }

        return () => {
            // Only close if this effect is for the currently active symbol
            if (activeSymbol === symbol && activeWebSocket) {
                if (activeWebSocket.readyState === WebSocket.OPEN) {
                    activeWebSocket.close();
                }
                activeWebSocket = null;
                activeSymbol = null;
            }
        };
    }, [symbol, range, setIsLoading]);
    
    return chartContainerRef;
} 