import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { displayCoin, watchlist } from "../domain.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
registerMainMenuItem({ label: "Watchlist", data: "view_list:start", order: 20 });
const composer = new Composer<Ctx>();
composer.callbackQuery("view_list:start", async (ctx) => { await ctx.answerCallbackQuery(); const list = watchlist(ctx); if (!list.length) { await ctx.reply("No coins yet — tap Add coin to start your watchlist.", { reply_markup: inlineKeyboard([[inlineButton("Add coin", "add_coin:start")], [inlineButton("Back to menu", "menu:main")]]) }); return; } await ctx.reply(`Your watchlist:\n${list.map((coin) => `• ${displayCoin(coin)}`).join("\n")}`, { reply_markup: inlineKeyboard([[inlineButton("Add coin", "add_coin:start"), inlineButton("Remove coin", "remove_coin:start")], [inlineButton("Check prices", "price:start")], [inlineButton("Back to menu", "menu:main")]]) }); });
export default composer;
