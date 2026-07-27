export interface Quote { price: number; change?: number; }
export interface CoinMatch { ticker: string; coinId: string; }
const common: Record<string, string> = { BTC: "bitcoin", ETH: "ethereum", TON: "the-open-network" };
export function commonCoin(ticker: string): CoinMatch | undefined {
  const normalized = ticker.trim().toUpperCase(); const coinId = common[normalized];
  return coinId ? { ticker: normalized, coinId } : undefined;
}
async function request(url: string): Promise<Response | undefined> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { const result = await fetch(url); if (result.ok) return result; if (result.status < 500 && result.status !== 429) return undefined; } catch { /* silent retry */ }
  }
  return undefined;
}
export async function resolveCoin(input: string): Promise<CoinMatch | undefined> {
  const known = commonCoin(input); if (known) return known;
  const response = await request(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(input.trim())}`);
  if (!response) return undefined;
  const body = await response.json() as { coins?: Array<{ id: string; symbol: string }> };
  const needle = input.trim().toLowerCase(); const coin = body.coins?.find((item) => item.symbol.toLowerCase() === needle) ?? body.coins?.[0];
  return coin ? { ticker: coin.symbol.toUpperCase(), coinId: coin.id } : undefined;
}
export async function getQuotes(ids: string[], currency: string): Promise<Record<string, Quote> | undefined> {
  if (ids.length === 0) return {};
  const output: Record<string, Quote> = {};
  for (let i = 0; i < ids.length; i += 100) {
    const response = await request(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.slice(i, i + 100).join(","))}&vs_currencies=${encodeURIComponent(currency)}&include_24hr_change=true`);
    if (!response) return undefined;
    const body = await response.json() as Record<string, Record<string, number>>;
    for (const [id, data] of Object.entries(body)) {
      const price = data[currency]; if (typeof price === "number") output[id] = { price, change: data[`${currency}_24h_change`] };
    }
  }
  return output;
}
export function formatQuote(ticker: string, quote: Quote, currency: string): string {
  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: quote.price < 1 ? 6 : 2 }).format(quote.price);
  const change = typeof quote.change === "number" ? ` (${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)}% today)` : "";
  return `${ticker}: ${price}${change}`;
}
