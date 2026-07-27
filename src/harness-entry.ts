import { buildBot } from "./bot.js";
export function makeBot() { return buildBot(process.env.BOT_TOKEN ?? "harness-test-token"); }
