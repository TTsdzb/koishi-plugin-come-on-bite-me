import { Context, Schema } from "koishi";
import {} from "@koishijs/cache";
import { Game } from "./game";

export const name = "come-on-bite-me";
export const inject = ["cache"];

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export async function apply(ctx: Context) {
  ctx.i18n.define("zh-CN", require("./locales/zh-CN"));
}

declare module "@koishijs/cache" {
  interface Tables {
    cobm_games: Game;
  }
}
