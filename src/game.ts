/**
 * Represent cards.
 */
export enum Cards {
  Rabbit = 1,
  Snake,
  Fox,
  Wolf,
  Leopard,
  Lion,
  Bear,
  Tiger,
  Hunter,
  Bacteria,
}

/**
 * Represent information of a player.
 */
export interface Player {
  id: string;
  name: string;
  currentCard: Cards;
  score: number;
}

/**
 * Represent the state of a game.
 */
export enum GameState {
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
  players: Player[];

  /**
   * Current player.
   */
  current: number;

  /**
   * Count bully poll for the game.
   */
  polledBully: number;
}

/**
 * Create a game with a given host.
 * @param host User id of whom triggered game creation
 */
export function newGame(host: Player): Game {
  return {
    currentState: GameState.joining,
    players: [host],
    current: 0,
    polledBully: 0,
  };
}

/**
 * Create a new player object with given user information.
 * @param id User id, usually from command session
 * @param name User name, usually from command session
 * @returns Player object with given information
 */
export function newPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    currentCard: Cards.Rabbit,
    score: 0,
  };
}

/**
 * Check if a user is already in a game.
 * @param game Game object of the channel
 * @param id User id
 * @returns Whether the user is already in the game
 */
export function checkInGame(game: Game, id: string): boolean {
  return game.players.some((player) => player.id === id);
}
