import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const base = (searchParams.get('base') || 'USD').toUpperCase();

  try {
    // Primary live exchange rate source: ExchangeRate-API Open Access
    const response = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`, {
      next: { revalidate: 300 },
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        return NextResponse.json({
          base: data.base_code || base,
          rates: data.rates,
          lastUpdated: data.time_last_update_utc
            ? new Date(data.time_last_update_utc).toISOString()
            : new Date().toISOString(),
          provider: 'ExchangeRate-API Live Feed',
        });
      }
    }

    // Secondary live source fallback: jsDelivr Currency API
    const fallbackRes = await fetch(
      `https://latest.currency-api.pages.dev/v1/currencies/${base.toLowerCase()}.json`,
      { next: { revalidate: 300 } }
    );

    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      const rawRates = fallbackData[base.toLowerCase()];
      if (rawRates) {
        const upperRates: Record<string, number> = {};
        for (const [k, v] of Object.entries(rawRates)) {
          if (typeof v === 'number') {
            upperRates[k.toUpperCase()] = v;
          }
        }
        return NextResponse.json({
          base,
          rates: upperRates,
          lastUpdated: fallbackData.date
            ? new Date(fallbackData.date).toISOString()
            : new Date().toISOString(),
          provider: 'Global Currency API Live',
        });
      }
    }

    return NextResponse.json(
      { error: 'Unable to fetch live exchange rates from upstream providers.' },
      { status: 502 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Network error while fetching live exchange rates.',
      },
      { status: 500 }
    );
  }
}
