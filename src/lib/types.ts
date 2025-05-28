// src/lib/types.ts
export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface GameSession {
  id: string;
  host_id: string;
  room_code: string;
  location: string;
  status: 'lobby' | 'active' | 'completed';
  current_turn_user_id: string | null;
  max_players: number;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface GamePlayer {
  game_id: string;
  user_id: string;
  username: string;
  turn_order: number;
  is_eliminated: boolean;
  joined_at: string;
  eliminated_at: string | null;
}

export interface GameMove {
  id: string;
  game_id: string;
  move_number: number;
  added_by_user_id: string;
  added_by_username: string;
  hold_description: string;
  photo_url: string | null;
  created_at: string;
}

export interface CreateGameData {
  location: string;
  max_players: number;
}

export interface JoinGameData {
  room_code: string;
  username: string;
}

export interface AddMoveData {
  hold_description: string;
  photo_url?: string;
}

// Real-time subscription types
export interface GameUpdate {
  type: 'player_joined' | 'player_left' | 'game_started' | 'turn_changed' | 'move_added' | 'game_ended';
  data: any;
}

export interface RealtimeGameState {
  session: GameSession | null;
  players: GamePlayer[];
  moves: GameMove[];
  currentPlayer: GamePlayer | null;
  isMyTurn: boolean;
}