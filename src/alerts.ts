import type { Ctx } from "./bot.js";
import { now } from "./clock.js";
import { profile, watchlist } from "./domain.js";
import type { Quote } from "./prices.js";

function quiet(ctx: Ctx, at: number): boolean {
  const settings = profile(ctx); if (!settings.quietStart || !settings.quietEnd || settings.quietStart === settings.quietEnd) return false;
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: settings.timezone ?? "UTC", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(at));
  const start = settings.quietStart, end = settings.quietEnd;
  return start < end ? time >= start && time < end : time >= start || time < end;
}
export async function evaluateAlerts(ctx: Ctx, quotes: Record<string, Quote>): Promise<void> {
  const at = now(); if (quiet(ctx, at)) return;
  const settings = profile(ctx);
  for (const coin of watchlist(ctx)) {
    const quote = quotes[coin.coinId]; if (!quote) continue;
    for (const alert of coin.alerts) {
      if (alert.cooldownUntil && alert.cooldownUntil > at) { alert.previousPrice = quote.price; continue; }
      const change = alert.previousPrice ? ((quote.price - alert.previousPrice) / alert.previousPrice) * 100 : undefined;
      const fired = alert.type === "threshold" ? quote.price >= alert.value : typeof change === "number" && Math.abs(change) >= alert.value;
      if (fired) {
        const old = alert.previousPrice ?? quote.price; alert.firedCount += 1; alert.cooldownUntil = at + settings.cooldownHours * 60 * 60 * 1000;
        await ctx.reply(`${coin.ticker} alert: ${old} → ${quote.price}${typeof change === "number" ? ` (${change >= 0 ? "+" : ""}${change.toFixed(2)}%)` : ""}.`);
      }
      alert.previousPrice = quote.price;
    }
  }
}
