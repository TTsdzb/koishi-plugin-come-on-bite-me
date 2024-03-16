import { User } from "koishi";

/**
 * Represent the state of a game.
 */
enum GameState {
  joining,
  started,
  pollingBully,
}

/**
 * Class to record all information of a game.
 */
export class Game {
  /**
   * State of the game.
   */
  currentState: GameState;

  /**
   * All participated players in the game.
   */
  players: User[];

  /**
   * The very first player who joined the game.
   */
  host: User;

  /**
   * Create a game with a given host.
   * @param host User who triggered game creation
   */
  constructor(host: User) {
    this.currentState = GameState.joining;
    this.players = [host];
    this.host = host;
  }

  /**
   * Join a player to this game.
   * @param player User who wants to join the game
   */
  join(player: User) {
    this.players.push(player);
  }
}
