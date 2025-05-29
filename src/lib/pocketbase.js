// src/lib/pocketbase.js
import PocketBase from 'pocketbase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PB_URL = 'https://pocketbase-p8cowg08c04okooc4kwgs4c8.mttwhlly.cc';

class PocketBaseClient {
  constructor() {
    this.pb = new PocketBase(PB_URL);
    this.setupAuth();
  }

  async setupAuth() {
    // Load auth from AsyncStorage on app start
    try {
      const authData = await AsyncStorage.getItem('pocketbase_auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        this.pb.authStore.save(parsed.token, parsed.model);
      }
    } catch (error) {
      console.error('Error loading auth from storage:', error);
    }

    // Save auth changes to AsyncStorage
    this.pb.authStore.onChange((token, model) => {
      const authData = { token, model };
      AsyncStorage.setItem('pocketbase_auth', JSON.stringify(authData))
        .catch(error => console.error('Error saving auth to storage:', error));
    });
  }

  // Auth methods
  async signUp(email, password, username) {
    try {
      console.log('PocketBase: Creating user account...');
      
      const user = await this.pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        username,
      });
      
      console.log('PocketBase: User created, signing in...');
      
      // Automatically sign in after signup
      const authData = await this.pb.collection('users').authWithPassword(email, password);
      
      console.log('PocketBase: Signup and signin successful');
      return { user: authData.record, error: null };
    } catch (error) {
      console.error('PocketBase: Signup error:', error);
      return { user: null, error };
    }
  }

  async signIn(email, password) {
    try {
      console.log('PocketBase: Signing in user...');
      
      const authData = await this.pb.collection('users').authWithPassword(email, password);
      
      console.log('PocketBase: Signin successful');
      return { user: authData.record, error: null };
    } catch (error) {
      console.error('PocketBase: Signin error:', error);
      return { user: null, error };
    }
  }

  signOut() {
    console.log('PocketBase: Signing out user');
    this.pb.authStore.clear();
    AsyncStorage.removeItem('pocketbase_auth');
  }

  get currentUser() {
    const user = this.pb.authStore.model;
    if (!user) return null;
    
    // Convert to format expected by your app
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      created_at: user.created,
    };
  }

  get isAuthenticated() {
    return this.pb.authStore.isValid;
  }

  // Game methods
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createGame(data) {
    try {
      const roomCode = this.generateRoomCode();
      console.log('PocketBase: Creating game with room code:', roomCode);
      
      const gameData = {
        host: this.currentUser.id,
        room_code: roomCode,
        location: data.location,
        max_players: data.max_players,
        status: 'lobby'
      };

      const game = await this.pb.collection('game_sessions').create(gameData);
      console.log('PocketBase: Game created:', game);
      
      // Add host as first player
      await this.pb.collection('game_players').create({
        game: game.id,
        user: this.currentUser.id,
        turn_order: 0,
        is_eliminated: false
      });
      
      console.log('PocketBase: Host added as player');
      return game;
    } catch (error) {
      console.error('PocketBase: Create game error:', error);
      throw error;
    }
  }

  async joinGame(roomCode) {
    try {
      console.log('PocketBase: Joining game with room code:', roomCode);
      
      // Find game by room code
      const games = await this.pb.collection('game_sessions').getList(1, 1, {
        filter: `room_code = "${roomCode.toUpperCase()}" && status = "lobby"`
      });

      if (games.items.length === 0) {
        throw new Error('Game not found or already started');
      }

      const game = games.items[0];
      console.log('PocketBase: Found game:', game);

      // Check if already in game
      const existingPlayers = await this.pb.collection('game_players').getList(1, 1, {
        filter: `game = "${game.id}" && user = "${this.currentUser.id}"`
      });

      if (existingPlayers.items.length > 0) {
        console.log('PocketBase: User already in game');
        return game; // Already in game
      }

      // Get current player count
      const players = await this.pb.collection('game_players').getList(1, 50, {
        filter: `game = "${game.id}"`
      });

      if (players.items.length >= game.max_players) {
        throw new Error('Game is full');
      }

      // Add player to game
      await this.pb.collection('game_players').create({
        game: game.id,
        user: this.currentUser.id,
        turn_order: players.items.length,
        is_eliminated: false
      });

      console.log('PocketBase: Successfully joined game');
      return game;
    } catch (error) {
      console.error('PocketBase: Join game error:', error);
      throw error;
    }
  }

  async startGame(gameId) {
    try {
      console.log('PocketBase: Starting game:', gameId);
      
      // Get game and verify user is host
      const game = await this.pb.collection('game_sessions').getOne(gameId);
      
      if (game.host !== this.currentUser.id) {
        throw new Error('Only the host can start the game');
      }

      // Get players
      const players = await this.pb.collection('game_players').getList(1, 50, {
        filter: `game = "${gameId}"`,
        sort: 'turn_order'
      });

      if (players.items.length < 2) {
        throw new Error('Need at least 2 players to start');
      }

      // Update game status and set first turn
      const updatedGame = await this.pb.collection('game_sessions').update(gameId, {
        status: 'active',
        started_at: new Date().toISOString(),
        current_turn_user: players.items[0].user
      });

      console.log('PocketBase: Game started successfully');
      return updatedGame;
    } catch (error) {
      console.error('PocketBase: Start game error:', error);
      throw error;
    }
  }

  async addMove(gameId, moveData) {
    try {
      console.log('PocketBase: Adding move to game:', gameId);
      
      // Get current game state
      const game = await this.pb.collection('game_sessions').getOne(gameId);
      
      if (game.current_turn_user !== this.currentUser.id) {
        throw new Error('Not your turn');
      }

      // Get current move count
      const moves = await this.pb.collection('game_moves').getList(1, 1, {
        filter: `game = "${gameId}"`,
        sort: '-move_number'
      });

      const moveNumber = moves.items.length > 0 ? moves.items[0].move_number + 1 : 1;
      console.log('PocketBase: Adding move number:', moveNumber);

      // Create move
      await this.pb.collection('game_moves').create({
        game: gameId,
        move_number: moveNumber,
        added_by: this.currentUser.id,
        hold_description: moveData.hold_description
      });

      // Get players and update turn
      const players = await this.pb.collection('game_players').getList(1, 50, {
        filter: `game = "${gameId}" && !is_eliminated`,
        sort: 'turn_order'
      });

      const currentIndex = players.items.findIndex(p => p.user === this.currentUser.id);
      const nextIndex = (currentIndex + 1) % players.items.length;
      const nextPlayer = players.items[nextIndex];

      await this.pb.collection('game_sessions').update(gameId, {
        current_turn_user: nextPlayer.user
      });

      console.log('PocketBase: Move added and turn updated');
      return true;
    } catch (error) {
      console.error('PocketBase: Add move error:', error);
      throw error;
    }
  }

  // Real-time subscriptions (much more reliable than Supabase!)
  subscribeToGame(gameId, callback) {
    console.log('PocketBase: Setting up real-time subscriptions for game:', gameId);
    
    // Subscribe to game session changes
    this.pb.collection('game_sessions').subscribe(gameId, (e) => {
      console.log('PocketBase: Game session update:', e.action);
      callback({ type: 'game_update', data: e });
    });
    
    // Subscribe to player changes  
    this.pb.collection('game_players').subscribe('*', (e) => {
      if (e.record.game === gameId) {
        console.log('PocketBase: Player update:', e.action);
        callback({ type: 'player_update', data: e });
      }
    });

    // Subscribe to move changes
    this.pb.collection('game_moves').subscribe('*', (e) => {
      if (e.record.game === gameId) {
        console.log('PocketBase: Move update:', e.action);
        callback({ type: 'move_update', data: e });
      }
    });
  }

  unsubscribeFromGame(gameId) {
    console.log('PocketBase: Unsubscribing from game:', gameId);
    this.pb.collection('game_sessions').unsubscribe(gameId);
    this.pb.collection('game_players').unsubscribe('*');
    this.pb.collection('game_moves').unsubscribe('*');
  }

  // Helper method to get file URLs
  getFileUrl(record, filename) {
    return this.pb.getFileUrl(record, filename);
  }
}

export const pb = new PocketBaseClient();