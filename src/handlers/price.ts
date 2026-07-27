import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { findCoin, profile, watchlist } from "../domain.js";
import { formatQuote, getQuotes, resolveCoin } from "../prices.js";
import { evaluateAlerts } from "../alerts.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
registerMainMenuItem({ label: "Check prices", data: "price:start", order: 40 });
const composer = new Composer<Ctx>();
async function show(ctx: Ctx, requested: string) {
  const settings = profile(ctx); let coins = requested.toLowerCase() === "all" ? watchlist(ctx) : [];
  if (!coins.length && requested.toLowerCase() !== "all") { const known = findCoin(ctx, requested.toUpperCase()); const resolved = known ?? await resolveCoin(requested); if (!resolved) { await ctx.reply("I couldn't find that ticker. Check the spelling and try again."); return; } coins = known ? [known] : [{ ticker: resolved.ticker, coinId: resolved.coinId, alerts: [] }]; }
  if (!coins.length) { await ctx.reply("No coins to price yet — add a coin to your watchlist first."); return; }
  const quotes = await getQuotes(coins.map((coin) => coin.coinId), settings.currency);
  if (!quotes) { await ctx.reply("Prices aren't available right now. Try again in a moment."); return; }
  await evaluateAlerts(ctx, quotes);
  const lines = coins.map((coin) => quotes[coin.coinId] ? formatQuote(coin.ticker, quotes[coin.coinId], settings.currency) : `${coin.ticker}: unavailable`);
  await ctx.reply(lines.join("\n"));
}
async function prompt(ctx: Ctx) { ctx.session.flow = { kind: "price" }; await ctx.reply("Send a ticker, or send all for your watchlist."); }
composer.command("price", prompt);
composer.callbackQuery("price:start", async (ctx) => { await ctx.answerCallbackQuery(); await prompt(ctx); });
composer.on("message:text", async (ctx, next) => { if (ctx.session.flow?.kind !== "price") return next(); const request = ctx.message.text.trim(); if (!request) { await ctx.reply("Send a ticker or all."); return; } ctx.session.flow = undefined; await show(ctx, request); });
export default composer;
