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
export interface Game {
  /**
   * State of the game.
   */
  currentState: GameState;

  /**
   * All participated players' user id in the game.
   */
  players: string[];

  /**
   * The very first player who joined the game.
   */
  host: string;
}

/**
 * Create a game with a given host.
 * @param host User id of whom triggered game creation
 */
export function newGame(host: string): Game {
  return { currentState: GameState.joining, players: [host], host };
}
