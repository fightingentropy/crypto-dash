import { NextResponse } from 'next/server';

const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_API_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

interface M2DataPoint {
  date: string;
  value: number;
}

async function fetchM2Data(years: number = 5): Promise<M2DataPoint[]> {
  if (!FRED_API_KEY) {
    throw new Error('FRED API key not configured');
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - years);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const url = `${FRED_API_BASE_URL}?series_id=M2SL&api_key=${FRED_API_KEY}&file_type=json&observation_start=${startDateStr}&observation_end=${endDateStr}&sort_order=asc`;
  
  const response = await fetch(url, { 
    next: { revalidate: 86400 } // Cache for 24 hours since M2 data is monthly
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
    
    const m2Data = await fetchM2Data(years);
    
    return NextResponse.json({
      data: m2Data,
      title: 'M2 Money Supply',
      unit: 'Billions of Dollars',
      description: 'M2 money supply includes cash, checking deposits, and easily-convertible near money'
    });
  } catch (error) {
    console.error('Error fetching M2 data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch M2 money supply data' }, 
      { status: 500 }
    );
  }
} 