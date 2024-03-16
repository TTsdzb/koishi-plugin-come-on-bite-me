import { Context, Schema } from "koishi";
import {} from "@koishijs/cache";
import { Game, checkInGame, newGame, newPlayer } from "./game";

export const name = "come-on-bite-me";
export const inject = ["cache"];

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export async function apply(ctx: Context) {
  ctx.i18n.define("zh-CN", require("./locales/zh-CN"));

  ctx.command("cobm.join").action(async ({ session }) => {
    // Verify if is used in guilds
    if (!session.guildId)
      return session.text("commands.cobm.messages.pleaseUseInGuilds");

    // Get current game of channel.
    const game = await ctx.cache.get("cobm_games", session.cid);
    const player = newPlayer(session.userId, session.username);

    // Create a new game if not exist for this group.
    if (game === undefined) {
      await ctx.cache.set("cobm_games", session.cid, newGame(player));
      return session.text(".newGameCreated", session);
    }

    // Check whether the player is already there.
    if (checkInGame(game, session.userId))
      return session.text(".alreadyInGame", session);

    game.players.push(player);
    await ctx.cache.set("cobm_games", session.cid, game);
    return session.text(".gameJoined", [game.players.length]);
  });
}

declare module "@koishijs/cache" {
  interface Tables {
    cobm_games: Game;
  }
}
