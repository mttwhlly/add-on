// src/app/game/[id].tsx - Debug version with manual refresh
import { useGame } from '@/hooks/use-game';
import { useRealtimeGame } from '@/hooks/use-realtime-game';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ActiveGame() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addMove, loading } = useGame();
  const { gameState, loading: gameLoading, refreshGameState } = useRealtimeGame(id);
  
  const [showAddMove, setShowAddMove] = useState(false);
  const [holdDescription, setHoldDescription] = useState('');

  console.log('=== GAME SCREEN DEBUG ===');
  console.log('Current turn user ID:', gameState.session?.current_turn_user_id);
  console.log('My turn:', gameState.isMyTurn);
  console.log('Current player:', gameState.currentPlayer?.username);

  const handleAddMove = async () => {
    if (!id || !holdDescription.trim()) {
      Alert.alert('Error', 'Please describe the hold');
      return;
    }

    const success = await addMove(id, {
      hold_description: holdDescription.trim(),
    });

    if (success) {
      setHoldDescription('');
      setShowAddMove(false);
      
      // Force refresh after successful move
      setTimeout(() => {
        console.log('Auto-refreshing game state after move...');
        refreshGameState?.();
      }, 1000);
    }
  };

  const handleManualRefresh = () => {
    console.log('Manual refresh triggered by user');
    refreshGameState?.();
  };

  const renderMove = ({ item, index }: { item: any; index: number }) => (
    <View className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold">Move {item.move_number}</Text>
        <Text className="text-sm text-gray-500">
          by {item.added_by_username}
        </Text>
      </View>
      <Text className="text-base">{item.hold_description}</Text>
      <Text className="text-xs text-gray-400 mt-2">
        {new Date(item.created_at).toLocaleTimeString()}
      </Text>
    </View>
  );

  const renderPlayer = ({ item }: { item: any }) => (
    <View className={`flex-row items-center px-3 py-2 rounded-lg mr-2 ${
      gameState.currentPlayer?.user_id === item.user_id 
        ? 'bg-green-100 border border-green-300' 
        : 'bg-gray-100'
    }`}>
      <View className={`w-3 h-3 rounded-full mr-2 ${
        gameState.currentPlayer?.user_id === item.user_id 
          ? 'bg-green-600' 
          : 'bg-gray-400'
      }`} />
      <Text className={`font-medium ${
        gameState.currentPlayer?.user_id === item.user_id 
          ? 'text-green-800' 
          : 'text-gray-700'
      }`}>
        {item.username}
      </Text>
    </View>
  );

  if (gameLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
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
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-600 font-medium text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold">{gameState.session.location}</Text>
          <TouchableOpacity onPress={handleManualRefresh}>
            <Text className="text-red-600 font-medium text-sm">🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
        
        {/* Current Turn Indicator */}
        <View className="mb-3">
          <Text className="text-sm text-gray-600 mb-2">Current Turn</Text>
          <FlatList
            data={gameState.players}
            renderItem={renderPlayer}
            keyExtractor={item => item.user_id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Debug Info */}
        <View className="bg-yellow-50 p-3 rounded-lg mb-3">
          <Text className="text-yellow-800 text-xs font-mono">
            Debug: Turn ID: {gameState.session.current_turn_user_id?.slice(0, 8)}...
          </Text>
          <Text className="text-yellow-800 text-xs font-mono">
            My Turn: {gameState.isMyTurn ? 'YES' : 'NO'}
          </Text>
          <Text className="text-yellow-800 text-xs font-mono">
            Current Player: {gameState.currentPlayer?.username || 'NONE'}
          </Text>
        </View>

        {gameState.isMyTurn && (
          <Text className="text-green-600 font-medium text-center">
            It's your turn! Add the next move.
          </Text>
        )}

        {!gameState.isMyTurn && gameState.currentPlayer && (
          <Text className="text-blue-600 font-medium text-center">
            Waiting for {gameState.currentPlayer.username} to make a move...
          </Text>
        )}
      </View>

      {/* Sequence */}
      <View className="flex-1 px-6 py-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold">
            Sequence ({gameState.moves.length} moves)
          </Text>
        </View>

        {gameState.moves.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500 text-center">
              No moves yet.{'\n'}The first player will start the sequence!
            </Text>
          </View>
        ) : (
          <FlatList
            data={gameState.moves}
            renderItem={renderMove}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            inverted
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>

      {/* Add Move Button */}
      {gameState.isMyTurn && (
        <View className="px-6 pb-6">
          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-4"
            onPress={() => setShowAddMove(true)}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Add Next Move
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Move Modal */}
      <Modal
        visible={showAddMove}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-6 py-4 border-b border-gray-200">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setShowAddMove(false)}>
                <Text className="text-blue-600 font-medium text-lg">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">Add Move</Text>
              <TouchableOpacity
                className={loading ? 'opacity-50' : ''}
                onPress={handleAddMove}
                disabled={loading}
              >
                <Text className="text-blue-600 font-medium text-lg">
                  {loading ? 'Adding...' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-1 px-6 py-6">
            <Text className="text-2xl font-bold mb-2">
              Move #{gameState.moves.length + 1}
            </Text>
            <Text className="text-gray-600 mb-6">
              Describe the next hold in the sequence
            </Text>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Hold Description *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-base"
                placeholder="e.g., Red jug on the overhang, left hand crimp near the corner..."
                value={holdDescription}
                onChangeText={setHoldDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
              <Text className="text-xs text-gray-500 mt-1">
                Be as specific as possible so others can find the hold
              </Text>
            </View>

            <View className="flex-1 justify-end">
              <TouchableOpacity
                className={`bg-blue-600 rounded-lg py-4 ${(!holdDescription.trim() || loading) ? 'opacity-50' : ''}`}
                onPress={handleAddMove}
                disabled={!holdDescription.trim() || loading}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  {loading ? 'Adding Move...' : 'Add Move'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}