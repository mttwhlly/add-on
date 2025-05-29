import { useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from './use-auth';

export const useGame = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async (gameData: { location: string; max_players: number }) => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Game Hook: Creating game...', gameData);
      
      const game = await pb.createGame(gameData);
      
      console.log('Game Hook: Game created successfully:', game.room_code);
      return game;
    } catch (err: any) {
      console.error('Game Hook: Create game error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (joinData: { room_code: string }) => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Game Hook: Joining game...', joinData.room_code);
      
      const game = await pb.joinGame(joinData.room_code);
      
      console.log('Game Hook: Successfully joined game:', game.room_code);
      return game;
    } catch (err: any) {
      console.error('Game Hook: Join game error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startGame = async (gameId: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Game Hook: Starting game...', gameId);
      
      await pb.startGame(gameId);
      
      console.log('Game Hook: Game started successfully');
      return true;
    } catch (err: any) {
      console.error('Game Hook: Start game error:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addMove = async (gameId: string, moveData: { hold_description: string }): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Game Hook: Adding move...', moveData.hold_description);
      
      await pb.addMove(gameId, moveData);
      
      console.log('Game Hook: Move added successfully');
      return true;
    } catch (err: any) {
      console.error('Game Hook: Add move error:', err);
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