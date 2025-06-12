import { NextResponse } from 'next/server';

interface FundingRate {
  symbol: string;
  rate: string;
  nextFundingTime: number;
  exchange: string;
}

export async function GET() {
  try {
    const rates: FundingRate[] = [];

    // Fetch Binance funding rates
    try {
      const binanceResponse = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex');
      const binanceData = await binanceResponse.json();
      
      const binanceSymbols = ['BTCUSDT', 'ETHUSDT', 'HYPEUSDT'];
      binanceSymbols.forEach(symbol => {
        const data = binanceData.find((item: { symbol: string }) => item.symbol === symbol);
        if (data) {
          // Funding is every 1 hour, so 24 times per day, 8760 times per year
          const annualizedAPR = (parseFloat(data.lastFundingRate) * 8760 * 100).toFixed(2);
          rates.push({
            symbol: symbol.replace('USDT', ''),
            rate: annualizedAPR,
            nextFundingTime: data.nextFundingTime,
            exchange: 'Binance'
          });
        }
      });
    } catch (e) {
      console.error('Binance funding rates error:', e);
    }

    // Fetch Hyperliquid funding rates
    try {
      const hyperliquidResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'metaAndAssetCtxs'
        })
      });
      const hyperliquidData = await hyperliquidResponse.json();
      
      if (hyperliquidData && hyperliquidData.length >= 2) {
        const [, assetCtxs] = hyperliquidData;
        
        ['BTC', 'ETH', 'HYPE'].forEach((symbol, index) => {
          const assetData = assetCtxs[index];
          if (assetData && assetData.funding !== undefined) {
            // Funding is every 1 hour, so 24 times per day, 8760 times per year
            const annualizedAPR = (parseFloat(assetData.funding) * 8760 * 100).toFixed(2);
            rates.push({
              symbol,
              rate: annualizedAPR,
              nextFundingTime: Date.now() + (1 * 60 * 60 * 1000), // Funding every 1 hour
              exchange: 'Hyperliquid'
            });
          }
        });
      }
    } catch (e) {
      console.error('Hyperliquid funding rates error:', e);
    }

    return NextResponse.json(rates);
  } catch (error) {
    console.error('Error fetching funding rates:', error);
    return NextResponse.json({ error: 'Failed to fetch funding rates' }, { status: 500 });
  }
} 