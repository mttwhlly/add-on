import { useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from './use-auth';

interface GameSession {
  id: string;
  host: string;
  room_code: string;
  location: string;
  status: 'lobby' | 'active' | 'completed';
  current_turn_user: string | null;
  max_players: number;
  created: string;
  started_at: string | null;
  ended_at: string | null;
}

interface GamePlayer {
  game: string;
  user: string;
  turn_order: number;
  is_eliminated: boolean;
  username?: string; // Will be populated from expanded data
}

interface GameMove {
  id: string;
  game: string;
  move_number: number;
  added_by: string;
  added_by_username?: string; // Will be populated from expanded data
  hold_description: string;
  created: string;
}

interface RealtimeGameState {
  session: GameSession | null;
  players: GamePlayer[];
  moves: GameMove[];
  currentPlayer: GamePlayer | null;
  isMyTurn: boolean;
}

export const useRealtimeGame = (gameId: string | null) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<RealtimeGameState>({
    session: null,
    players: [],
    moves: [],
    currentPlayer: null,
    isMyTurn: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !user?.id) {
      console.log('PocketBase Realtime: Missing gameId or user, skipping setup');
      setLoading(false);
      return;
    }

    console.log('PocketBase Realtime: Setting up for game:', gameId);

    let mounted = true;

    const fetchGameData = async () => {
      if (!mounted) return;
      
      setLoading(true);
      
      try {
        console.log('PocketBase Realtime: Fetching initial game data...');

        // Fetch game session with expanded relations
        const session = await pb.pb.collection('game_sessions').getOne(gameId, {
          expand: 'host,current_turn_user'
        });

        // Fetch players with expanded user data
        const playersResult = await pb.pb.collection('game_players').getList(1, 50, {
          filter: `game = "${gameId}"`,
          sort: 'turn_order',
          expand: 'user'
        });

        // Fetch moves with expanded user data
        const movesResult = await pb.pb.collection('game_moves').getList(1, 50, {
          filter: `game = "${gameId}"`,
          sort: 'move_number',
          expand: 'added_by'
        });

        if (!mounted) return;

        // Transform players data
        const players = playersResult.items.map(item => ({
          ...item,
          username: item.expand?.user?.username || 'Unknown'
        }));

        // Transform moves data  
        const moves = movesResult.items.map(item => ({
          ...item,
          added_by_username: item.expand?.added_by?.username || 'Unknown'
        }));

        const currentPlayer = players.find(p => p.user === session.current_turn_user) || null;
        const isMyTurn = session.current_turn_user === user.id;

        console.log('PocketBase Realtime: Game data loaded');
        console.log('- Current turn user:', session.current_turn_user);
        console.log('- My user ID:', user.id);
        console.log('- Is my turn:', isMyTurn);
        console.log('- Current player:', currentPlayer?.username);

        setGameState({
          session,
          players,
          moves,
          currentPlayer,
          isMyTurn,
        });
      } catch (error) {
        console.error('PocketBase Realtime: Error fetching game data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchGameData();

    // Set up real-time subscriptions - MUCH more reliable than Supabase!
    console.log('PocketBase Realtime: Setting up subscriptions...');
    
    const handleRealtimeUpdate = (update) => {
      console.log('PocketBase Realtime: Received update:', update.type);
      // Refresh game data when any related record changes
      fetchGameData();
    };

    pb.subscribeToGame(gameId, handleRealtimeUpdate);

    return () => {
      console.log('PocketBase Realtime: Cleaning up subscriptions');
      mounted = false;
      pb.unsubscribeFromGame(gameId);
    };
  }, [gameId, user?.id]);

  const isHost = gameState.session?.host === user?.id;
  const myPlayer = gameState.players.find(p => p.user === user?.id);
  const canStart = isHost && gameState.session?.status === 'lobby' && gameState.players.length >= 2;

  const refreshGameState = async () => {
    if (!gameId || !user?.id) return;
    
    console.log('PocketBase Realtime: Manual refresh triggered');
    
    try {
      // Fetch fresh data
      const session = await pb.pb.collection('game_sessions').getOne(gameId, {
        expand: 'host,current_turn_user'
      });

      const playersResult = await pb.pb.collection('game_players').getList(1, 50, {
        filter: `game = "${gameId}"`,
        sort: 'turn_order',
        expand: 'user'
      });

      const movesResult = await pb.pb.collection('game_moves').getList(1, 50, {
        filter: `game = "${gameId}"`,
        sort: 'move_number',
        expand: 'added_by'
      });

      const players = playersResult.items.map(item => ({
        ...item,
        username: item.expand?.user?.username || 'Unknown'
      }));

      const moves = movesResult.items.map(item => ({
        ...item,
        added_by_username: item.expand?.added_by?.username || 'Unknown'
      }));

      const currentPlayer = players.find(p => p.user === session.current_turn_user) || null;
      const isMyTurn = session.current_turn_user === user.id;

      console.log('PocketBase Realtime: Manual refresh complete');

      setGameState({
        session,
        players,
        moves,
        currentPlayer,
        isMyTurn,
      });
    } catch (error) {
      console.error('PocketBase Realtime: Error refreshing game state:', error);
    }
  };

  return {
    gameState,
    loading,
    isHost,
    myPlayer,
    canStart,
    refreshGameState,
  };
};