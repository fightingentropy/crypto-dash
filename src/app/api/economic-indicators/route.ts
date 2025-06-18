import { NextResponse } from 'next/server';
import { getEconomicIndicators } from '@/lib/economicIndicators';

export async function GET() {
  try {
    const indicators = await getEconomicIndicators();
    return NextResponse.json(indicators);
  } catch (error) {
    console.error('Error fetching economic indicators:', error);
    return NextResponse.json({ error: 'Failed to fetch economic indicators' }, { status: 500 });
  }
}
