import { NextResponse } from 'next/server';

interface Asset {
  name: string;
  price: number;
  volume: number;
  funding: number | null;
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
    const [meta, assetCtxs] = data;
    
    const assets: Asset[] = [];

    if (meta.universe && assetCtxs) {
        // The universe array and assetCtxs array correspond by index.
        meta.universe.forEach((assetInfo: any, index: number) => {
            if (SYMBOLS.includes(assetInfo.name)) {
                const assetCtx = assetCtxs[index];
                assets.push({
                    name: assetInfo.name,
                    price: assetCtx.markPx ? parseFloat(assetCtx.markPx) : 0,
                    volume: assetCtx.dayNtlVlm ? parseFloat(assetCtx.dayNtlVlm) : 0,
                    funding: assetCtx.funding ? parseFloat(assetCtx.funding) : null,
                });
            }
        });
    }

    // Ensure the order is the same as the SYMBOLS array for consistent display
    const sortedAssets = SYMBOLS.map(symbol => assets.find(a => a.name === symbol) || { name: symbol, price: 0, volume: 0, funding: null });

    return NextResponse.json(sortedAssets);
  } catch (error) {
    console.error('Root error in GET market-data:', error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
} 