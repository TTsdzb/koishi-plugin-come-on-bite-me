import { Context, h, Schema, Session } from "koishi";
import {} from "@koishijs/cache";
import { Game, GameState, checkInGame, newGame, newPlayer } from "./game";

export const name = "come-on-bite-me";
export const inject = ["cache"];

export interface Config {
  gameStartAuthority: number;
}

export const Config: Schema<Config> = Schema.object({
  gameStartAuthority: Schema.number()
    .default(2)
    .description("非游戏创建者开始游戏所需的最低权限。"),
});

/**
 * Wraps a given message segment with a quote and an at.
 * @param session Session of the command
 * @param message Message to send
 * @returns A message segment contains a quote, an at, and the given message
 */
function buildReplyAndAt(session: Session, message: h): h {
  return (
    <>
      <quote id={session.messageId} /> <at id={session.userId} /> {message}
    </>
  );
}

/**
 * Generate the ranking of a game, usually used when a game terminates.
 * @param game Game from which we get the rank
 * @returns Message segments represent the ranking of the game
 */
function getGameRank(game: Game): h[] {
  return game.players
    .sort((a, b) => b.score - a.score)
    .map((player) => (
      <p>
        {player.name}: {player.score}
      </p>
    ));
}

export async function apply(ctx: Context, config: Config) {
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
      return buildReplyAndAt(
        session,
        <i18n path="commands.cobm.messages.gameNotJoined" />
      );

    // Check if game already started.
    if (game.currentState !== GameState.joining)
      return buildReplyAndAt(session, <i18n path=".gameAlreadyStarted" />);

    // Remove player from game.
    game.players.splice(
      game.players.findIndex((player) => player.id === session.userId)
    );

    // Abort game if everyone quit.
    if (game.players.length === 0) {
      await ctx.cache.delete("cobm_games", session.cid);
      return buildReplyAndAt(session, <i18n path=".gameQuitAndAbort" />);
    }

    // Save game if anyone left.
    await ctx.cache.set("cobm_games", session.cid, game);
    return buildReplyAndAt(session, <i18n path=".gameQuit" />);
  });

  ctx.command("cobm.start").action(async ({ session }) => {
    // Verify if is used in guilds
    if (!session.guildId)
      return <i18n path="commands.cobm.messages.pleaseUseInGuilds" />;

    // Get current game of channel.
    const game = await ctx.cache.get("cobm_games", session.cid);

    // Check if user in game.
    if (game === undefined || !checkInGame(game, session.userId))
      return buildReplyAndAt(
        session,
        <i18n path="commands.cobm.messages.gameNotJoined" />
      );

    // Check if user has authority.
    if (
      (await session.getUser<"authority">()).authority <
        config.gameStartAuthority &&
      game.players[0].id !== session.userId
    )
      return buildReplyAndAt(session, <i18n path=".notAllowed" />);

    // Start the game
    game.currentState = GameState.started;
    await ctx.cache.set("cobm_games", session.cid, game);
    return buildReplyAndAt(
      session,
      <>
        <i18n path=".gameStarted" />
        <p>
          <i18n path="commands.cobm.messages.yourTurnToAct">
            {session.userId}
          </i18n>
        </p>
      </>
    );
  });

  ctx.command("cobm.stop").action(async ({ session }) => {
    // Verify if is used in guilds
    if (!session.guildId)
      return <i18n path="commands.cobm.messages.pleaseUseInGuilds" />;

    // Get current game of channel.
    const game = await ctx.cache.get("cobm_games", session.cid);

    // Check if user in game.
    if (game === undefined || !checkInGame(game, session.userId))
      return buildReplyAndAt(
        session,
        <i18n path="commands.cobm.messages.gameNotJoined" />
      );

    // Check if user has authority.
    if (
      (await session.getUser<"authority">()).authority <
        config.gameStartAuthority &&
      game.players[0].id !== session.userId
    )
      return buildReplyAndAt(session, <i18n path=".notAllowed" />);

    // End a game.
    await ctx.cache.delete("cobm_games", session.cid);
    return buildReplyAndAt(
      session,
      <>
        <i18n path=".gameStopped" />
        <p>
          <i18n path="commands.cobm.messages.gameRank" />
          {getGameRank(game)}
        </p>
      </>
    );
  });
}

declare module "@koishijs/cache" {
  interface Tables {
    cobm_games: Game;
  }
}
