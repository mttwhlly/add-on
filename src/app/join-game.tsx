// app/join-game.tsx
import { useGame } from '@/hooks/use-game';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function JoinGame() {
  const { joinGame, loading } = useGame();
  const [roomCode, setRoomCode] = useState('');

  const handleJoinGame = async () => {
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    const game = await joinGame({
      room_code: roomCode.trim().toUpperCase(),
    });

    if (game) {
      router.replace(`/game/lobby/${game.id}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-blue-600 font-medium text-lg">← Back</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold ml-4">Join Game</Text>
          </View>
        </View>

        <View className="flex-1 px-6 py-6">
          <View className="mb-8">
            <Text className="text-2xl font-bold mb-2">Join a Session</Text>
            <Text className="text-gray-600">
              Enter the room code shared by the game host to join their climbing session.
            </Text>
          </View>

          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Room Code *
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-4 text-xl font-mono text-center tracking-widest"
              placeholder="ABC123"
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
            />
            <Text className="text-xs text-gray-500 mt-1 text-center">
              Room codes are 6 characters long
            </Text>
          </View>

          <View className="flex-1 justify-end">
            <TouchableOpacity
              className={`bg-green-600 rounded-lg py-4 ${(loading || !roomCode.trim()) ? 'opacity-50' : ''}`}
              onPress={handleJoinGame}
              disabled={loading || !roomCode.trim()}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {loading ? 'Joining Game...' : 'Join Game'}
              </Text>
            </TouchableOpacity>

            <Text className="text-xs text-gray-500 text-center mt-3">
              Make sure you're at the same climbing location as the host
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}