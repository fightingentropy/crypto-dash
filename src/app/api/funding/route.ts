import { NextResponse } from 'next/server';

interface FundingRate {
  symbol: string;
  rate: string;
  nextFundingTime: number;
  exchange: string;
}

interface ExchangeFundingData {
  fundingRate: string;
  nextFundingTime: number;
  fundingIntervalHours?: number;
}

type ExchangeEntry = [string, ExchangeFundingData | null];
type SymbolFundingData = [string, ExchangeEntry[]];

export async function GET() {
  try {
    const rates: FundingRate[] = [];

    // Fetch real Binance funding rates from Hyperliquid API
    try {
      const hyperliquidResponse = await fetch('https://api-ui.hyperliquid.xyz/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'predictedFundings'
        })
      });
      const hyperliquidData = await hyperliquidResponse.json();
      
            if (Array.isArray(hyperliquidData)) {
        const targetSymbols = ['BTC', 'ETH', 'HYPE'];
        
        targetSymbols.forEach(symbol => {
          const symbolData = (hyperliquidData as SymbolFundingData[]).find(([sym]) => sym === symbol);
          if (symbolData && symbolData[1]) {
            const exchanges = symbolData[1];
            
            // Get Binance data
            const binanceData = exchanges.find(([exchange]: ExchangeEntry) => exchange === 'BinPerp');
            if (binanceData && binanceData[1] && binanceData[1].fundingRate) {
              // Binance funding is every 8 hours, so 3 times per day, 1095 times per year
              const annualizedAPR = (parseFloat(binanceData[1].fundingRate) * 1095 * 100).toFixed(2);
              rates.push({
                symbol,
                rate: annualizedAPR,
                nextFundingTime: binanceData[1].nextFundingTime,
                exchange: 'Binance'
              });
            }
            
            // Get Hyperliquid data
            const hlData = exchanges.find(([exchange]: ExchangeEntry) => exchange === 'HlPerp');
            if (hlData && hlData[1] && hlData[1].fundingRate) {
              // Hyperliquid funding is every 1 hour, so 24 times per day, 8760 times per year
              const annualizedAPR = (parseFloat(hlData[1].fundingRate) * 8760 * 100).toFixed(2);
            rates.push({
              symbol,
              rate: annualizedAPR,
                nextFundingTime: hlData[1].nextFundingTime,
              exchange: 'Hyperliquid'
            });
            }
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