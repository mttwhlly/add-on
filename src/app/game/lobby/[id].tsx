// src/app/game/lobby/[id].tsx
import { useGame } from '@/hooks/use-game';
import { useRealtimeGame } from '@/hooks/use-realtime-game';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function GameLobby() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { startGame, loading } = useGame();
  const { gameState, loading: gameLoading, isHost, canStart } = useRealtimeGame(id);

  useEffect(() => {
    if (gameState.session?.status === 'active') {
      router.replace(`/game/${id}`);
    }
  }, [gameState.session?.status, id]);

  const handleStartGame = async () => {
    if (!id) return;
    
    const success = await startGame(id);
    if (!success) {
      Alert.alert('Error', 'Failed to start game');
    }
  };

  const handleShareGame = async () => {
    if (!gameState.session) return;

    try {
      await Share.share({
        message: `Join my Add On climbing game!\n\nRoom Code: ${gameState.session.room_code}\nLocation: ${gameState.session.location}`,
        title: 'Join Add On Game',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderPlayer = ({ item, index }: { item: any; index: number }) => (
    <View className="flex-row items-center justify-between py-3 px-4 bg-gray-50 rounded-lg mb-2">
      <View className="flex-row items-center">
        <View className="w-8 h-8 bg-blue-600 rounded-full items-center justify-center mr-3">
          <Text className="text-white font-semibold">{index + 1}</Text>
        </View>
        <Text className="text-base font-medium">{item.username}</Text>
      </View>
      {gameState.session?.host_id === item.user_id && (
        <View className="bg-yellow-100 px-2 py-1 rounded">
          <Text className="text-yellow-800 text-xs font-medium">HOST</Text>
        </View>
      )}
    </View>
  );

  if (gameLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameState.session) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text>Game not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-600 mt-2">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-600 font-medium text-lg">← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShareGame}>
            <Text className="text-blue-600 font-medium">Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 px-6 py-6">
        {/* Game Info */}
        <View className="mb-6">
          <Text className="text-2xl font-bold mb-2">Game Lobby</Text>
          <View className="bg-blue-50 rounded-lg p-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-600">Room Code</Text>
              <Text className="text-xl font-bold text-blue-600">
                {gameState.session.room_code}
              </Text>
            </View>
            <Text className="text-base font-medium mb-1">
              {gameState.session.location}
            </Text>
            <Text className="text-sm text-gray-600">
              {gameState.players.length} of {gameState.session.max_players} players
            </Text>
          </View>
        </View>

        {/* Players List */}
        <View className="flex-1">
          <Text className="text-lg font-semibold mb-3">Players</Text>
          <FlatList
            data={gameState.players}
            renderItem={renderPlayer}
            keyExtractor={item => item.user_id}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Actions */}
        <View className="pt-4">
          {isHost ? (
            <TouchableOpacity
              className={`bg-green-600 rounded-lg py-4 ${(!canStart || loading) ? 'opacity-50' : ''}`}
              onPress={handleStartGame}
              disabled={!canStart || loading}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {loading ? 'Starting Game...' : 'Start Game'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="bg-gray-100 rounded-lg py-4">
              <Text className="text-gray-600 text-center font-medium">
                Waiting for host to start the game...
              </Text>
            </View>
          )}
          
          {gameState.players.length < 2 && (
            <Text className="text-orange-600 text-center text-sm mt-2">
              Need at least 2 players to start
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}