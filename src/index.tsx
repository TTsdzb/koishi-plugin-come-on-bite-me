import { Context, h, Schema, Session } from "koishi";
import {} from "@koishijs/cache";
import { Game, GameState, checkInGame, newGame, newPlayer } from "./game";

export const name = "come-on-bite-me";
export const inject = ["cache"];

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

function buildReplyAndAt(session: Session, message: h): h {
  return (
    <>
      <quote id={session.messageId} /> <at id={session.userId} /> {message}
    </>
  );
}

export async function apply(ctx: Context) {
  ctx.i18n.define("zh-CN", require("./locales/zh-CN"));

  ctx.command("cobm.join").action(async ({ session }) => {
    // Verify if is used in guilds
    if (!session.guildId)
      return <i18n path="commands.cobm.messages.pleaseUseInGuilds" />;

    // Get current game of channel.
    const game = await ctx.cache.get("cobm_games", session.cid);
    const player = newPlayer(session.userId, session.username);

    // Create a new game if not exist for this group.
    if (game === undefined) {
      await ctx.cache.set("cobm_games", session.cid, newGame(player));
      return buildReplyAndAt(session, <i18n path=".newGameCreated" />);
    }

    // Check if game already started.
    if (game.currentState !== GameState.joining)
      return buildReplyAndAt(session, <i18n path=".gameAlreadyStarted" />);

    // Check whether the player is already there.
    if (checkInGame(game, session.userId))
      return buildReplyAndAt(session, <i18n path=".alreadyInGame" />);

    // Add player into game.
    game.players.push(player);
    await ctx.cache.set("cobm_games", session.cid, game);
    return buildReplyAndAt(
      session,
      <i18n path=".gameJoined">{game.players.length}</i18n>
    );
  });

  ctx.command("cobm.quit").action(async ({ session }) => {
    // Verify if is used in guilds
    if (!session.guildId)
      return <i18n path="commands.cobm.messages.pleaseUseInGuilds" />;

    // Get current game of channel.
    const game = await ctx.cache.get("cobm_games", session.cid);

    // Check if the player is in the game.
    if (game === undefined || !checkInGame(game, session.userId))
      return buildReplyAndAt(session, <i18n path=".gameNotJoined" />);

    // Check if game already started.
    if (game.currentState !== GameState.joining)
      return buildReplyAndAt(session, <i18n path=".gameAlreadyStarted" />);

    // Remove player from game.
    game.players.splice(
      game.players.findIndex((player) => player.id === session.userId)
    );

    // Abort game if everyone quit,
    if (game.players.length === 0) {
      await ctx.cache.delete("cobm_games", session.cid);
      return buildReplyAndAt(session, <i18n path=".gameQuitAndAbort" />);
    }

    // Save game if anyone left.
    await ctx.cache.set("cobm_games", session.cid, game);
    return buildReplyAndAt(session, <i18n path=".gameQuit" />);
  });
}

declare module "@koishijs/cache" {
  interface Tables {
    cobm_games: Game;
  }
}
