import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { profile } from "../domain.js";
import { inlineButton, inlineKeyboard, mainMenuKeyboard } from "../toolkit/index.js";
const composer = new Composer<Ctx>();
const welcome = "Track crypto prices, keep a private watchlist, and get alerts without the noise.";
composer.command("start", async (ctx) => {
  const settings = profile(ctx);
  if (!settings.timezone) {
    ctx.session.flow = { kind: "timezone" };
    await ctx.reply(`${welcome}\n\nWhat timezone are you in? Send an IANA name like Europe/London, or tap Skip.`, { reply_markup: inlineKeyboard([[inlineButton("Skip for now", "timezone:skip")]]) });
    return;
  }
  await ctx.reply(welcome, { reply_markup: mainMenuKeyboard() });
});
composer.callbackQuery("timezone:skip", async (ctx) => { await ctx.answerCallbackQuery(); profile(ctx).timezone = "UTC"; ctx.session.flow = undefined; await ctx.editMessageText(welcome, { reply_markup: mainMenuKeyboard() }); });
composer.on("message:text", async (ctx, next) => {
  if (ctx.session.flow?.kind !== "timezone") return next();
  const value = ctx.message.text.trim();
  try { Intl.DateTimeFormat(undefined, { timeZone: value }); } catch { await ctx.reply("I couldn't use that timezone. Try Europe/London, or tap Skip."); return; }
  profile(ctx).timezone = value; ctx.session.flow = undefined;
  await ctx.reply(welcome, { reply_markup: mainMenuKeyboard() });
});
composer.callbackQuery("menu:main", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText(welcome, { reply_markup: mainMenuKeyboard() }); });
export default composer;
