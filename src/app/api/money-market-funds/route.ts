import { NextResponse } from 'next/server';

const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_API_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

interface MMFDataPoint {
  date: string;
  value: number;
}

async function fetchMMFData(years: number = 5): Promise<MMFDataPoint[]> {
  if (!FRED_API_KEY) {
    throw new Error('FRED API key not configured');
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - years);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // MMMFFAQ027S is the series ID for Money Market Funds; Total Financial Assets, Level
  const url = `${FRED_API_BASE_URL}?series_id=MMMFFAQ027S&api_key=${FRED_API_KEY}&file_type=json&observation_start=${startDateStr}&observation_end=${endDateStr}&sort_order=asc`;
  
  const response = await fetch(url, { 
    next: { revalidate: 86400 } // Cache for 24 hours since MMF data is quarterly
  });
  
  if (!response.ok) {
    throw new Error(`FRED API error: ${response.status}`);
  }

  const data = await response.json();
  const observations = data.observations || [];

  return observations
    .filter((obs: { value: string; date: string }) => obs.value !== '.' && !isNaN(parseFloat(obs.value)))
    .map((obs: { value: string; date: string }) => ({
      date: obs.date,
      value: parseFloat(obs.value)
    }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const years = parseInt(searchParams.get('years') || '5');
    
    const mmfData = await fetchMMFData(years);
    
    return NextResponse.json({
      data: mmfData,
      title: 'Money Market Funds',
      unit: 'Millions of Dollars',
      description: 'Money Market Funds; Total Financial Assets, Level'
    });
  } catch (error) {
    console.error('Error fetching Money Market Funds data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Money Market Funds data' }, 
      { status: 500 }
    );
  }
} 