import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
  }

  // If symbol is HYPE, fetch from Hyperliquid
  if (symbol.toUpperCase() === 'HYPE') {
    // Hyperliquid API for historical candles using POST to /info endpoint
    const url = `https://api.hyperliquid.xyz/info`;
    const endTime = Date.now();
    const startTime = endTime - (1000 * 60 * 60 * 1000); // 1000 hours ago
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'candleSnapshot',
          req: {
            coin: 'HYPE',
            interval: '1h',
            startTime: startTime,
            endTime: endTime
          }
        })
      });
      
      if (!res.ok) {
        const text = await res.text();
        console.error('Hyperliquid fetch failed:', res.status, text);
        return NextResponse.json({ error: `Failed to fetch from Hyperliquid: ${res.status} ${text}` }, { status: 500 });
      }
      const data = await res.json();
      return NextResponse.json(data);
    } catch (e) {
      console.error('Hyperliquid fetch error:', e);
      return NextResponse.json({ error: 'Fetch error: ' + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
    }
  }

  // Otherwise, fetch from Binance spot
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}USDT&interval=1h&limit=1000`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Binance' }, { status: 500 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Fetch error' }, { status: 500 });
  }
} 