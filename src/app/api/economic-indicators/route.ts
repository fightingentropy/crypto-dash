import { NextResponse } from 'next/server';

const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_API_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

interface Indicator {
  name: string;
  value: string;
  date: string;
}

const SERIES_IDS = {
  GDP: 'GDP', // Real Gross Domestic Product, Quarterly
  CPI: 'CPIAUCSL', // Consumer Price Index, Monthly
  UNEMPLOYMENT: 'UNRATE', // Unemployment Rate, Monthly
};

async function fetchIndicator(seriesId: string): Promise<{ date: string; value: string } | null> {
  const url = `${FRED_API_BASE_URL}?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 3600 * 24 } }); // Revalidate once a day
    if (!response.ok) {
      console.error(`Failed to fetch ${seriesId}: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    const observation = data.observations?.[0];
    if (observation) {
      return {
        date: observation.date,
        value: observation.value,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${seriesId}:`, error);
    return null;
  }
}

async function fetchCpiYearOverYear() {
    const url = `${FRED_API_BASE_URL}?series_id=${SERIES_IDS.CPI}&api_key=${FRED_API_KEY}&file_type=json&limit=13&sort_order=desc`;
    try {
      const response = await fetch(url, { next: { revalidate: 3600 * 24 } });
      if (!response.ok) return null;
      const data = await response.json();
      const observations = data.observations;
      if (observations && observations.length >= 13) {
        const currentValue = parseFloat(observations[0].value);
        const previousValue = parseFloat(observations[12].value);
        const yoyChange = ((currentValue - previousValue) / previousValue) * 100;
        return {
          date: observations[0].date,
          value: yoyChange.toFixed(1) + '%',
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching CPI YoY:`, error);
      return null;
    }
}


export async function GET() {
  if (!FRED_API_KEY) {
    console.error('FRED_API_KEY is not set.');
    return NextResponse.json({ error: 'FRED API key not configured' }, { status: 500 });
  }

  try {
    const [gdpData, cpiData, unemploymentData] = await Promise.all([
      fetchIndicator(SERIES_IDS.GDP),
      fetchCpiYearOverYear(),
      fetchIndicator(SERIES_IDS.UNEMPLOYMENT),
    ]);

    const indicators: Indicator[] = [];
    if (gdpData) {
        const gdpValue = (parseFloat(gdpData.value) / 1000).toFixed(2) + 'T';
        indicators.push({ name: 'GDP (Quarterly)', value: gdpValue, date: gdpData.date });
    }
    if (cpiData) {
        indicators.push({ name: 'CPI Inflation Rate', value: cpiData.value, date: cpiData.date });
    }
    if (unemploymentData) {
        indicators.push({ name: 'Unemployment Rate', value: unemploymentData.value + '%', date: unemploymentData.date });
    }

    return NextResponse.json(indicators);
  } catch (error) {
    console.error('Error fetching economic indicators:', error);
    return NextResponse.json({ error: 'Failed to fetch economic indicators' }, { status: 500 });
  }
} 