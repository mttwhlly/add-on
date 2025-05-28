// src/hooks/use-game.tsx - Debug version
import { supabase, generateRoomCode } from '@/lib/supabase';
import { GameSession, GamePlayer, GameMove, CreateGameData, JoinGameData, AddMoveData } from '@/lib/types';
import { useState } from 'react';
import { useAuth } from './use-auth';

export const useGame = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async (gameData: CreateGameData): Promise<GameSession | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const roomCode = generateRoomCode();
      console.log('Creating game with room code:', roomCode);
      
      const { data, error } = await supabase
        .from('game_sessions')
        .insert([
          {
            host_id: user.id,
            room_code: roomCode,
            location: gameData.location,
            max_players: gameData.max_players,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Create game error:', error);
        throw error;
      }

      console.log('Game created:', data);

      // Add host as first player
      const { error: playerError } = await supabase
        .from('game_players')
        .insert([
          {
            game_id: data.id,
            user_id: user.id,
            username: user.username,
            turn_order: 0,
          },
        ]);

      if (playerError) {
        console.error('Error adding host as player:', playerError);
        throw playerError;
      }

      console.log('Host added as player');
      return data;
    } catch (err: any) {
      console.error('Create game catch error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (joinData: JoinGameData): Promise<GameSession | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Joining game with room code:', joinData.room_code);
      
      // Find game by room code
      const { data: gameData, error: gameError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('room_code', joinData.room_code.toUpperCase())
        .eq('status', 'lobby')
        .single();

      if (gameError) {
        console.error('Game lookup error:', gameError);
        throw new Error('Game not found or already started');
      }

      console.log('Found game:', gameData);

      // Check if game is full
      const { count } = await supabase
        .from('game_players')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', gameData.id);

      console.log('Current player count:', count);

      if (count && count >= gameData.max_players) {
        throw new Error('Game is full');
      }

      // Check if user already in game
      const { data: existingPlayer } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameData.id)
        .eq('user_id', user.id)
        .single();

      if (existingPlayer) {
        console.log('User already in game');
        return gameData; // Already in game
      }

      // Add player to game
      const nextTurnOrder = count || 0;
      const { error: joinError } = await supabase
        .from('game_players')
        .insert([
          {
            game_id: gameData.id,
            user_id: user.id,
            username: user.username,
            turn_order: nextTurnOrder,
          },
        ]);

      if (joinError) {
        console.error('Error joining game:', joinError);
        throw joinError;
      }

      console.log('Successfully joined game');
      return gameData;
    } catch (err: any) {
      console.error('Join game catch error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startGame = async (gameId: string): Promise<boolean> => {
    if (!user) {
      console.error('No user found');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting game:', gameId);
      console.log('Current user:', user.id);
      
      // Get first player to start
      const { data: players, error: playersError } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId)
        .order('turn_order');

      if (playersError) {
        console.error('Error fetching players:', playersError);
        throw playersError;
      }

      console.log('Players in game:', players);

      if (!players || players.length < 2) {
        throw new Error('Need at least 2 players to start');
      }

      // Verify user is host
      const { data: gameSession, error: gameError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) {
        console.error('Error fetching game session:', gameError);
        throw gameError;
      }

      console.log('Game session:', gameSession);
      console.log('Host ID:', gameSession.host_id);
      console.log('Current user ID:', user.id);

      if (gameSession.host_id !== user.id) {
        throw new Error('Only the host can start the game');
      }

      // Update game status and set first turn
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          current_turn_user_id: players[0].user_id,
        })
        .eq('id', gameId)
        .eq('host_id', user.id); // Only host can start

      if (updateError) {
        console.error('Error updating game status:', updateError);
        throw updateError;
      }

      console.log('Game started successfully!');
      return true;
    } catch (err: any) {
      console.error('Start game catch error:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addMove = async (gameId: string, moveData: AddMoveData): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('=== ADD MOVE DEBUG ===');
      console.log('User making move:', user.id, user.username);
      
      // Get current game state
      const { data: game, error: gameError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) {
        console.error('Error fetching game:', gameError);
        throw gameError;
      }

      console.log('Current turn user ID:', game?.current_turn_user_id);
      console.log('Is it my turn?', game?.current_turn_user_id === user.id);

      if (!game || game.current_turn_user_id !== user.id) {
        throw new Error('Not your turn');
      }

      // Get current move count
      const { count, error: countError } = await supabase
        .from('game_moves')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', gameId);

      if (countError) {
        console.error('Error counting moves:', countError);
        throw countError;
      }

      const moveNumber = (count || 0) + 1;
      console.log('Adding move number:', moveNumber);

      // Add the move
      const { error: moveError } = await supabase
        .from('game_moves')
        .insert([
          {
            game_id: gameId,
            move_number: moveNumber,
            added_by_user_id: user.id,
            added_by_username: user.username,
            hold_description: moveData.hold_description,
            photo_url: moveData.photo_url || null,
          },
        ]);

      if (moveError) {
        console.error('Error adding move:', moveError);
        throw moveError;
      }

      console.log('Move added successfully');

      // Get all players in turn order
      const { data: players, error: playersError } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId)
        .eq('is_eliminated', false)
        .order('turn_order');

      if (playersError) {
        console.error('Error fetching players:', playersError);
        throw playersError;
      }

      console.log('Players in turn order:', players?.map(p => ({
        username: p.username,
        user_id: p.user_id,
        turn_order: p.turn_order
      })));

      if (players && players.length > 0) {
        const currentPlayerIndex = players.findIndex(p => p.user_id === user.id);
        console.log('Current player index:', currentPlayerIndex);
        
        if (currentPlayerIndex === -1) {
          throw new Error('Current player not found in players list');
        }

        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        const nextPlayer = players[nextPlayerIndex];
        
        console.log('Next player index:', nextPlayerIndex);
        console.log('Next player:', nextPlayer.username, nextPlayer.user_id);

        // Update turn
        console.log('Updating turn to:', nextPlayer.user_id);
        console.log('Game ID:', gameId);
        
        const { data: updateData, error: turnError } = await supabase
          .from('game_sessions')
          .update({ current_turn_user_id: nextPlayer.user_id })
          .eq('id', gameId)
          .select(); // Add select to see what was updated

        console.log('Update result:', updateData);
        
        if (turnError) {
          console.error('Error updating turn:', turnError);
          throw turnError;
        }

        if (!updateData || updateData.length === 0) {
          console.error('No rows were updated! This means the WHERE clause did not match.');
          throw new Error('Failed to update turn - no matching rows');
        }

        console.log('Turn updated successfully. New session data:', updateData[0]);
        
        // Force a small delay then trigger a state refresh
        setTimeout(async () => {
          console.log('Triggering manual state refresh...');
          
          // Fetch updated game state
          const { data: refreshedSession } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('id', gameId)
            .single();
            
          if (refreshedSession) {
            console.log('Refreshed session data:', refreshedSession);
            // The real-time hook should pick this up, but we can also trigger a manual refresh
          }
        }, 500);
      }

      console.log('=== ADD MOVE COMPLETE ===');
      return true;
    } catch (err: any) {
      console.error('Add move error:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createGame,
    joinGame,
    startGame,
    addMove,
  };
};