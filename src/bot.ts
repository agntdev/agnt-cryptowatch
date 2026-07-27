import { Composer } from "grammy";
import { createBot, resolveSessionStorage, type BotContext, type CreateBotOptions } from "./toolkit/index.js";
import type { StorageAdapter } from "grammy";
import addCoin from "./handlers/add-coin-start.js";
import configureSummary from "./handlers/configure-summary-start.js";
import help from "./handlers/help.js";
import price from "./handlers/price.js";
import removeCoin from "./handlers/remove-coin-start.js";
import setAlert from "./handlers/set-alert-start.js";
import setQuietHours from "./handlers/set-quiet-hours-start.js";
import start from "./handlers/start.js";
import viewList from "./handlers/view-list-start.js";

export interface Alert {
  id: string;
  ticker: string;
  type: "threshold" | "percent";
  value: number;
  timeframeHours?: number;
  previousPrice?: number;
  firedCount: number;
  cooldownUntil?: number;
}
export interface Coin { ticker: string; nickname?: string; coinId: string; alerts: Alert[] }
export interface Profile {
  timezone?: string;
  quietStart?: string;
  quietEnd?: string;
  summaryTime?: string;
  summaryEnabled: boolean;
  cooldownHours: number;
  currency: string;
}
export interface DomainData { profile: Profile; watchlist: Coin[] }
export interface Session {
  flow?: { kind: string; ticker?: string; type?: "threshold" | "percent"; value?: number; timeframeHours?: number };
}
export type Ctx = BotContext<Session>;
export type DomainCtx = Ctx & { domain?: DomainData };

export interface BuildBotOptions {
  handlers?: Composer<Ctx>[];
  storage?: StorageAdapter<Session>;
  telemetryEnv?: CreateBotOptions<Session>["telemetryEnv"];
  telemetryReporterOptions?: CreateBotOptions<Session>["telemetryReporterOptions"];
}

// Keep this assembly synchronous: the replay gate dispatches updates immediately.
// The Worker passes its generated manifest; Node and the harness use these static imports.
export function buildBot(token: string, opts: BuildBotOptions = {}) {
  const storage = resolveSessionStorage<Session>(opts.storage);
  const bot = createBot<Session>(token, {
    initial: () => ({}), storage, telemetryEnv: opts.telemetryEnv,
    telemetryReporterOptions: opts.telemetryReporterOptions,
  });
  // Conversation state is ephemeral. Profile/watchlist records use a separate,
  // indexed durable key in the same toolkit-selected persistent adapter.
  const domain = new Composer<Ctx>();
  domain.use(async (ctx, next) => {
    const key = ctx.from && ctx.chat ? `crypto:user:${ctx.chat.id}:${ctx.from.id}` : undefined;
    if (key) {
      const saved = await storage.read(key) as unknown as DomainData | undefined;
      (ctx as DomainCtx).domain = saved ?? { profile: { summaryEnabled: false, cooldownHours: 6, currency: "usd" }, watchlist: [] };
    }
    await next();
    if (key && (ctx as DomainCtx).domain) await storage.write(key, (ctx as DomainCtx).domain as unknown as Session);
  });
  bot.use(domain);
  const handlers = opts.handlers ?? [addCoin, configureSummary, help, price, removeCoin, setAlert, setQuietHours, start, viewList];
  for (const handler of handlers) bot.use(handler);
  bot.on("message", (ctx) => ctx.reply("Sorry, I didn't understand that. Try /help."));
  return bot;
}
