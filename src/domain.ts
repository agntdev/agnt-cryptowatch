import type { Alert, Coin, Ctx, DomainCtx, Profile } from "./bot.js";

function data(ctx: Ctx) {
  const current = ctx as DomainCtx;
  return (current.domain ??= { profile: { summaryEnabled: false, cooldownHours: 6, currency: "usd" }, watchlist: [] });
}

export function profile(ctx: Ctx): Profile {
  return data(ctx).profile;
}
export function watchlist(ctx: Ctx): Coin[] { return data(ctx).watchlist; }
export function displayCoin(coin: Coin): string { return coin.nickname ? `${coin.nickname} (${coin.ticker})` : coin.ticker; }
export function addCoin(ctx: Ctx, ticker: string, coinId: string, nickname?: string): Coin | undefined {
  const list = watchlist(ctx);
  if (list.some((coin) => coin.ticker === ticker)) return undefined;
  const coin: Coin = { ticker, coinId, nickname, alerts: [] }; list.push(coin); return coin;
}
export function findCoin(ctx: Ctx, ticker: string): Coin | undefined { return watchlist(ctx).find((coin) => coin.ticker === ticker); }
export function removeCoin(ctx: Ctx, ticker: string): boolean {
  const list = watchlist(ctx); const at = list.findIndex((coin) => coin.ticker === ticker);
  if (at < 0) return false; list.splice(at, 1); return true;
}
export function newAlertId(ticker: string, type: string, value: number): string {
  return `${ticker}-${type}-${String(value).replace(/[^a-zA-Z0-9]/g, "")}`;
}
