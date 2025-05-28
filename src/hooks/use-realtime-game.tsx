// src/hooks/use-realtime-game.tsx - Fixed version
import { supabase } from '@/lib/supabase';
import { GameSession, GamePlayer, GameMove, RealtimeGameState } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';

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
      console.log('Missing gameId or user, skipping setup');
      setLoading(false);
      return;
    }

    console.log('=== REALTIME GAME SETUP ===');
    console.log('Game ID:', gameId);
    console.log('User:', user.email);

    let mounted = true; // Track if component is still mounted
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchInitialData = async () => {
      if (!mounted) return;
      
      setLoading(true);
      
      try {
        console.log('Fetching initial game data...');

        // Fetch game session
        const { data: session, error: sessionError } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('id', gameId)
          .single();

        if (sessionError || !mounted) {
          if (sessionError) console.error('Error fetching session:', sessionError);
          return;
        }

        // Fetch players
        const { data: players, error: playersError } = await supabase
          .from('game_players')
          .select('*')
          .eq('game_id', gameId)
          .order('turn_order');

        if (playersError || !mounted) {
          if (playersError) console.error('Error fetching players:', playersError);
          return;
        }

        // Fetch moves
        const { data: moves, error: movesError } = await supabase
          .from('game_moves')
          .select('*')
          .eq('game_id', gameId)
          .order('move_number');

        if (movesError || !mounted) {
          if (movesError) console.error('Error fetching moves:', movesError);
          return;
        }

        if (!mounted) return;

        const currentPlayer = players?.find(p => p.user_id === session?.current_turn_user_id) || null;
        const isMyTurn = session?.current_turn_user_id === user.id;

        console.log('=== GAME STATE UPDATE ===');
        console.log('Current turn user ID:', session?.current_turn_user_id);
        console.log('My user ID:', user.id);
        console.log('Is my turn:', isMyTurn);
        console.log('Current player:', currentPlayer?.username);

        setGameState({
          session: session || null,
          players: players || [],
          moves: moves || [],
          currentPlayer,
          isMyTurn,
        });

        // Set up polling for when it's not my turn
        if (!isMyTurn && session?.status === 'active') {
          console.log('Not my turn, setting up polling...');
          
          if (pollInterval) clearInterval(pollInterval);
          
          pollInterval = setInterval(async () => {
            if (!mounted) return;
            
            console.log('🔄 Polling for turn changes...');
            
            const { data: latestSession } = await supabase
              .from('game_sessions')
              .select('*')
              .eq('id', gameId)
              .single();
              
            if (latestSession && latestSession.current_turn_user_id !== session.current_turn_user_id) {
              console.log('📢 Turn changed detected! Refreshing...');
              refreshGameState();
            }
          }, 2000); // Check every 2 seconds
        } else {
          // Clear polling if it's my turn
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      } catch (error) {
        console.error('Error fetching game data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchInitialData();

    // Set up real-time subscriptions with unique channel names
    const channelName = `game_${gameId}_${user.id}_${Date.now()}`;
    console.log('Setting up real-time subscription:', channelName);

    const gameChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log('=== GAME SESSION REAL-TIME UPDATE ===');
          console.log('Payload:', payload);
          
          if (!mounted) return;
          
          const updatedSession = payload.new as GameSession;
          console.log('Updated session current_turn_user_id:', updatedSession.current_turn_user_id);
          
          setGameState(prev => {
            const currentPlayer = prev.players.find(p => p.user_id === updatedSession.current_turn_user_id) || null;
            const isMyTurn = updatedSession.current_turn_user_id === user.id;
            
            console.log('Real-time: New current player:', currentPlayer?.username);
            console.log('Real-time: New is my turn:', isMyTurn);
            
            // Update polling based on turn
            if (pollInterval) clearInterval(pollInterval);
            if (!isMyTurn && updatedSession.status === 'active') {
              console.log('Real-time update: Not my turn, resuming polling...');
              pollInterval = setInterval(async () => {
                if (!mounted) return;
                console.log('🔄 Polling after real-time update...');
                refreshGameState();
              }, 2000);
            }
            
            return {
              ...prev,
              session: updatedSession,
              currentPlayer,
              isMyTurn,
            };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${gameId}`,
        },
        async () => {
          console.log('=== PLAYERS REAL-TIME UPDATE ===');
          
          if (!mounted) return;
          
          const { data: players } = await supabase
            .from('game_players')
            .select('*')
            .eq('game_id', gameId)
            .order('turn_order');

          if (mounted) {
            setGameState(prev => ({
              ...prev,
              players: players || [],
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_moves',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          console.log('=== NEW MOVE REAL-TIME ===');
          
          if (!mounted) return;
          
          const newMove = payload.new as GameMove;
          console.log('New move:', newMove);
          
          setGameState(prev => ({
            ...prev,
            moves: [...prev.moves, newMove],
          }));
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscription:', channelName);
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
      gameChannel.unsubscribe();
    };
  }, [gameId, user?.id]); // Only depend on stable values

  const isHost = gameState.session?.host_id === user?.id;
  const myPlayer = gameState.players.find(p => p.user_id === user?.id);
  const canStart = isHost && gameState.session?.status === 'lobby' && gameState.players.length >= 2;

  const refreshGameState = async () => {
    if (!gameId || !user?.id) return;
    
    console.log('Manual refresh triggered...');
    
    try {
      const { data: session } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', gameId)
        .single();

      const { data: players } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId)
        .order('turn_order');

      const { data: moves } = await supabase
        .from('game_moves')
        .select('*')
        .eq('game_id', gameId)
        .order('move_number');

      if (session && players && moves) {
        const currentPlayer = players.find(p => p.user_id === session.current_turn_user_id) || null;
        const isMyTurn = session.current_turn_user_id === user.id;

        console.log('Manual refresh - Current turn:', session.current_turn_user_id);
        console.log('Manual refresh - Is my turn:', isMyTurn);

        setGameState({
          session,
          players,
          moves,
          currentPlayer,
          isMyTurn,
        });
      }
    } catch (error) {
      console.error('Error refreshing game state:', error);
    }
  };

  return {
    gameState,
    loading,
    isHost,
    myPlayer,
    canStart,
    refreshGameState, // Export the manual refresh function
  };
};