import { NextResponse } from 'next/server';

interface Asset {
  name: string;
  price: number;
  volume: number;
  funding: number | null;
}

interface AssetContext {
    name: string;
    dayNtlVlm: string;
    markPx: string;
    funding: string;
}

const SYMBOLS = ['BTC', 'ETH', 'HYPE', 'SOL', 'FARTCOIN', 'XRP', 'SUI', 'kPEPE', 'SPX', 'AAVE'];

export async function GET() {
  try {
    const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({type: 'metaAndAssetCtxs'}),
        next: { revalidate: 30 },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch market data: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const [meta, assetCtxs]: [any, AssetContext[]] = data;
    
    const assets: Asset[] = [];

    if (meta.universe && assetCtxs) {
        const universe = meta.universe;
        const assetCtxMap = new Map(universe.map((u: {name: string}, i: number) => [u.name, assetCtxs[i]]));
        
        for (const symbol of SYMBOLS) {
            const assetData: Partial<AssetContext> = assetCtxMap.get(symbol) || {};
            assets.push({
                name: symbol,
                price: assetData.markPx ? parseFloat(assetData.markPx) : 0,
                volume: assetData.dayNtlVlm ? parseFloat(assetData.dayNtlVlm) : 0,
                funding: assetData.funding ? parseFloat(assetData.funding) : null,
            });
        }
    }

    // Ensure the order is the same as the SYMBOLS array for consistent display
    const sortedAssets = SYMBOLS.map(symbol => assets.find(a => a.name === symbol) || { name: symbol, price: 0, volume: 0, funding: null });

    return NextResponse.json(sortedAssets);
  } catch (error) {
    console.error('Root error in GET market-data:', error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
} 