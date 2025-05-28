// src/app/game/lobby/[id].tsx - Enhanced with better real-time notifications
import { useGame } from '@/hooks/use-game';
import { useRealtimeGame } from '@/hooks/use-realtime-game';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  Share,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Vibration,
} from 'react-native';

export default function GameLobby() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { startGame, loading } = useGame();
  const { 
    gameState, 
    loading: gameLoading, 
    isHost, 
    canStart,
    playerCount,
    maxPlayers,
    refreshGameState 
  } = useRealtimeGame(id);
  
  const [lastPlayerCount, setLastPlayerCount] = useState(0);
  const [showPlayerJoinedNotification, setShowPlayerJoinedNotification] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const notificationAnim = useRef(new Animated.Value(0)).current;

  // Track player count changes and show notifications to host
  useEffect(() => {
    if (playerCount > lastPlayerCount && lastPlayerCount > 0 && isHost) {
      const newestPlayer = gameState.players[playerCount - 1];
      if (newestPlayer) {
        setNewPlayerName(newestPlayer.username);
        setShowPlayerJoinedNotification(true);
        
        // Vibrate to get host's attention
        Vibration.vibrate([0, 200, 100, 200]);
        
        // Show notification animation
        Animated.sequence([
          Animated.timing(notificationAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(3000),
          Animated.timing(notificationAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowPlayerJoinedNotification(false);
        });
      }
    }
    setLastPlayerCount(playerCount);
  }, [playerCount, lastPlayerCount, isHost, gameState.players]);

  // Start pulsing animation when can start
  useEffect(() => {
    if (canStart) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [canStart, pulseAnim]);

  // Redirect when game starts
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
        message: `Join my Add On climbing game!\n\nRoom Code: ${gameState.session.room_code}\nLocation: ${gameState.session.location}\n\nPlayers: ${playerCount}/${maxPlayers}`,
        title: 'Join Add On Game',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderPlayer = ({ item, index }: { item: any; index: number }) => {
    const isNew = index === playerCount - 1 && showPlayerJoinedNotification;
    
    return (
      <Animated.View 
        style={{
          opacity: isNew ? notificationAnim : 1,
          transform: [{
            scale: isNew ? notificationAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }) : 1
          }]
        }}
        className={`flex-row items-center justify-between py-3 px-4 rounded-lg mb-2 ${
          isNew ? 'bg-green-100 border border-green-300' : 'bg-gray-50'
        }`}
      >
        <View className="flex-row items-center">
          <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
            isNew ? 'bg-green-600' : 'bg-blue-600'
          }`}>
            <Text className="text-white font-semibold">{index + 1}</Text>
          </View>
          <View>
            <Text className={`text-base font-medium ${isNew ? 'text-green-800' : 'text-gray-900'}`}>
              {item.username}
            </Text>
            {isNew && (
              <Text className="text-green-600 text-xs font-medium">Just joined!</Text>
            )}
          </View>
        </View>
        
        <View className="flex-row items-center space-x-2">
          {gameState.session?.host_id === item.user_id && (
            <View className="bg-yellow-100 px-2 py-1 rounded">
              <Text className="text-yellow-800 text-xs font-medium">HOST</Text>
            </View>
          )}
          {isNew && (
            <View className="bg-green-100 px-2 py-1 rounded">
              <Text className="text-green-800 text-xs font-medium">NEW</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  if (gameLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg">Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameState.session) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg mb-4">Game not found</Text>
          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-blue-600 rounded-lg px-6 py-3"
          >
            <Text className="text-white font-medium">Go Back</Text>
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
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity 
              onPress={refreshGameState}
              className="bg-gray-100 px-3 py-1 rounded"
            >
              <Text className="text-gray-600 text-sm">🔄 Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShareGame}>
              <Text className="text-blue-600 font-medium">Share</Text>
            </TouchableOpacity>
          </View>
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
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-600">
                {playerCount} of {maxPlayers} players
              </Text>
              {playerCount >= 2 && (
                <Text className="text-green-600 text-sm font-medium">
                  ✅ Ready to start!
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Host notification */}
        {isHost && (
          <View className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <Text className="text-yellow-800 font-medium text-sm">
              🎯 You're the host! Players will be notified when you start the game.
            </Text>
            {playerCount < 2 && (
              <Text className="text-yellow-700 text-sm mt-1">
                Share the room code and wait for at least one more player to join.
              </Text>
            )}
          </View>
        )}

        {/* Waiting notification for non-hosts */}
        {!isHost && (
          <View className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Text className="text-blue-800 font-medium text-sm">
              ⏳ Waiting for the host to start the game...
            </Text>
          </View>
        )}

        {/* Players List */}
        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold">Players</Text>
            <View className="flex-row items-center">
              <View className={`w-3 h-3 rounded-full mr-2 ${
                playerCount >= 2 ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <Text className="text-sm text-gray-600">
                {playerCount >= 2 ? 'Ready' : 'Waiting'}
              </Text>
            </View>
          </View>
          
          <FlatList
            data={gameState.players}
            renderItem={renderPlayer}
            keyExtractor={item => item.user_id}
            showsVerticalScrollIndicator={false}
            extraData={showPlayerJoinedNotification} // Re-render when notification state changes
          />
        </View>

        {/* Actions */}
        <View className="pt-4">
          {isHost ? (
            <Animated.View style={{ transform: [{ scale: canStart ? pulseAnim : 1 }] }}>
              <TouchableOpacity
                className={`rounded-lg py-4 ${
                  canStart 
                    ? 'bg-green-600' 
                    : 'bg-gray-400'
                } ${loading ? 'opacity-50' : ''}`}
                onPress={handleStartGame}
                disabled={!canStart || loading}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  {loading ? 'Starting Game...' : 
                   canStart ? '🚀 Start Game' : 'Need More Players'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View className="bg-gray-100 rounded-lg py-4">
              <Text className="text-gray-600 text-center font-medium">
                Waiting for host to start the game...
              </Text>
            </View>
          )}
          
          {playerCount < 2 && (
            <View className="mt-3 bg-orange-50 rounded-lg p-3">
              <Text className="text-orange-800 text-center text-sm">
                ⚠️ Need at least 2 players to start
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Player joined notification overlay */}
      {showPlayerJoinedNotification && (
        <Animated.View 
          style={{
            opacity: notificationAnim,
            transform: [{
              translateY: notificationAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              })
            }]
          }}
          className="absolute top-20 left-6 right-6 bg-green-500 rounded-lg p-4 shadow-lg z-10"
        >
          <Text className="text-white font-semibold text-center">
            🎉 {newPlayerName} joined the game!
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}