import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { addCoin } from "../domain.js";
import { commonCoin, resolveCoin } from "../prices.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
registerMainMenuItem({ label: "➕ Add coin", data: "add_coin:start", order: 10 });
const composer = new Composer<Ctx>();
const choices = inlineKeyboard([[inlineButton("BTC", "coin:add:BTC"), inlineButton("ETH", "coin:add:ETH"), inlineButton("TON", "coin:add:TON")], [inlineButton("Type a ticker", "coin:add:typed")], [inlineButton("Back to menu", "menu:main")]]);
composer.callbackQuery("add_coin:start", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.reply("Choose a coin to add, or type its ticker.", { reply_markup: choices }); });
composer.callbackQuery("coin:add:typed", async (ctx) => { await ctx.answerCallbackQuery(); ctx.session.flow = { kind: "add-ticker" }; await ctx.reply("Send the ticker you want to track."); });
composer.callbackQuery(/^coin:add:(BTC|ETH|TON)$/, async (ctx) => { await ctx.answerCallbackQuery(); const found = commonCoin(ctx.match![1]); if (!found) return; ctx.session.flow = { kind: "add-nickname", ticker: found.ticker }; await ctx.reply(`Add a nickname for ${found.ticker}, or tap Use ticker.`, { reply_markup: inlineKeyboard([[inlineButton("Use ticker", `coin:save:${found.ticker}`)]]) }); });
composer.callbackQuery(/^coin:save:([A-Z0-9]{1,12})$/, async (ctx) => { await ctx.answerCallbackQuery(); const ticker = ctx.match![1]; const found = commonCoin(ticker); if (!found) { await ctx.reply("That coin isn't available right now. Try again from Add coin."); return; } const coin = addCoin(ctx, ticker, found.coinId); ctx.session.flow = undefined; await ctx.reply(coin ? `${ticker} is on your watchlist.` : `${ticker} is already on your watchlist.`); });
composer.on("message:text", async (ctx, next) => {
  if (ctx.session.flow?.kind === "add-ticker") { const found = await resolveCoin(ctx.message.text); if (!found) { await ctx.reply("I couldn't find that ticker. Check the spelling and try again."); return; } ctx.session.flow = { kind: "add-nickname", ticker: found.ticker }; await ctx.reply(`Add a nickname for ${found.ticker}, or tap Use ticker.`, { reply_markup: inlineKeyboard([[inlineButton("Use ticker", `coin:save:${found.ticker}`)]]) }); return; }
  if (ctx.session.flow?.kind === "add-nickname") { const ticker = ctx.session.flow.ticker!; const found = commonCoin(ticker) ?? await resolveCoin(ticker); if (!found) { await ctx.reply("That coin isn't available right now. Start again from Add coin."); return; } const nickname = ctx.message.text.trim().slice(0, 40); const coin = addCoin(ctx, ticker, found.coinId, nickname || undefined); ctx.session.flow = undefined; await ctx.reply(coin ? `${ticker} is on your watchlist as ${nickname || ticker}.` : `${ticker} is already on your watchlist.`); return; }
  await next();
});
export default composer;
