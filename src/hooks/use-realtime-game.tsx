// src/hooks/use-realtime-game.tsx - Temporarily disable realtime to avoid ws issues
import { supabase } from '@/lib/supabase';
import { GameSession, GamePlayer, GameMove, RealtimeGameState } from '@/lib/types';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './use-auth';

// Temporarily disable realtime to avoid ws/stream issues
const DISABLE_REALTIME = true;

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

  // Memoized fetch function to prevent infinite re-renders
  const fetchGameData = useCallback(async () => {
    if (!gameId || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Fetching game data for:', gameId);

      // Fetch all data in parallel for better performance
      const [sessionResult, playersResult, movesResult] = await Promise.all([
        supabase
          .from('game_sessions')
          .select('*')
          .eq('id', gameId)
          .single(),
        supabase
          .from('game_players')
          .select('*')
          .eq('game_id', gameId)
          .order('turn_order'),
        supabase
          .from('game_moves')
          .select('*')
          .eq('game_id', gameId)
          .order('move_number')
      ]);

      if (sessionResult.error) {
        console.error('Session fetch error:', sessionResult.error);
        return;
      }

      const session = sessionResult.data;
      const players = playersResult.data || [];
      const moves = movesResult.data || [];

      const currentPlayer = players.find(p => p.user_id === session?.current_turn_user_id) || null;
      const isMyTurn = session?.current_turn_user_id === user.id;

      console.log('📊 Game data updated:', {
        playersCount: players.length,
        movesCount: moves.length,
        currentTurn: currentPlayer?.username,
        isMyTurn,
        status: session?.status
      });

      setGameState({
        session,
        players,
        moves,
        currentPlayer,
        isMyTurn,
      });

    } catch (error) {
      console.error('Error fetching game data:', error);
    } finally {
      setLoading(false);
    }
  }, [gameId, user?.id]);

  useEffect(() => {
    if (!gameId || !user?.id) {
      console.log('Missing gameId or user, skipping setup');
      setLoading(false);
      return;
    }

    console.log('=== SETTING UP GAME DATA FETCHING ===');
    console.log('Game ID:', gameId);
    console.log('User:', user.email);
    console.log('Realtime disabled:', DISABLE_REALTIME);

    let mounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    // Initial data fetch
    fetchGameData();

    if (DISABLE_REALTIME) {
      // Use polling instead of realtime subscriptions
      console.log('🔄 Setting up polling (realtime disabled)...');
      
      pollInterval = setInterval(() => {
        if (!mounted) return;
        console.log('🔄 Polling for updates...');
        fetchGameData();
      }, 3000); // Poll every 3 seconds
      
    } else {
      // Real-time subscriptions (currently disabled)
      console.log('📡 Real-time subscriptions would be set up here');
    }

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up game data fetching');
      mounted = false;
      
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [gameId, user?.id, fetchGameData]);

  // Manual refresh function
  const refreshGameState = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    fetchGameData();
  }, [fetchGameData]);

  // Derived state
  const isHost = gameState.session?.host_id === user?.id;
  const myPlayer = gameState.players.find(p => p.user_id === user?.id);
  const canStart = isHost && gameState.session?.status === 'lobby' && gameState.players.length >= 2;

  // Host-specific helpers
  const playerCount = gameState.players.length;
  const maxPlayers = gameState.session?.max_players || 0;
  const isGameFull = playerCount >= maxPlayers;

  return {
    gameState,
    loading,
    isHost,
    myPlayer,
    canStart,
    refreshGameState,
    // Additional lobby info
    playerCount,
    maxPlayers,
    isGameFull,
  };
};