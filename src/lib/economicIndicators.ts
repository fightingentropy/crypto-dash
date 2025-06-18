const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_API_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

export interface Indicator {
  name: string;
  value: string;
  date: string;
}

async function fetchIndicator(seriesId: string) {
  const url = `${FRED_API_BASE_URL}?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) return null;
  const data = await response.json();
  const obs = data.observations?.[0];
  return obs ? { date: obs.date, value: obs.value } : null;
}

async function fetchCpiYearOverYear() {
  const url = `${FRED_API_BASE_URL}?series_id=CPIAUCSL&api_key=${FRED_API_KEY}&file_type=json&limit=13&sort_order=desc`;
  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) return null;
  const data = await response.json();
  const obs = data.observations;
  if (!obs || obs.length < 13) return null;
  const current = parseFloat(obs[0].value);
  const previous = parseFloat(obs[12].value);
  const yoy = ((current - previous) / previous) * 100;
  return { date: obs[0].date, value: yoy.toFixed(1) + '%' };
}

export async function getEconomicIndicators(): Promise<Indicator[]> {
  if (!FRED_API_KEY) return [];
  const [gdpData, cpiData, unemploymentData] = await Promise.all([
    fetchIndicator('GDP'),
    fetchCpiYearOverYear(),
    fetchIndicator('UNRATE')
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

  return indicators;
}
