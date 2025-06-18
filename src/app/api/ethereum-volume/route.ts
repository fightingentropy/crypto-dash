import { NextRequest, NextResponse } from 'next/server';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ETHERSCAN_API_URL = 'https://api.etherscan.io/api';

export async function GET(request: NextRequest) {
  if (!ETHERSCAN_API_KEY) {
    console.error('ETHERSCAN_API_KEY is not set.');
    return NextResponse.json({ error: 'Etherscan API key not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const url = `${ETHERSCAN_API_URL}?module=stats&action=dailytx&startdate=${startDate}&enddate=${endDate}&sort=asc&apikey=${ETHERSCAN_API_KEY}`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      console.error('Failed to fetch Ethereum tx volume:', response.statusText);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    const data = await response.json();
    const result = data.result as { unixTime: string; value: string }[];
    const volume = result.map(d => ({
      date: new Date(parseInt(d.unixTime, 10) * 1000).toISOString().slice(0, 10),
      value: parseFloat(d.value),
    }));
    return NextResponse.json(volume);
  } catch (error) {
    console.error('Root error in GET ethereum-volume:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
