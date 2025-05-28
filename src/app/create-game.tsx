// src/app/create-game.tsx
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

export default function CreateGame() {
  const { createGame, loading } = useGame();
  const [location, setLocation] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('6');

  const handleCreateGame = async () => {
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    const maxPlayersNum = parseInt(maxPlayers);
    if (isNaN(maxPlayersNum) || maxPlayersNum < 2 || maxPlayersNum > 12) {
      Alert.alert('Error', 'Max players must be between 2 and 12');
      return;
    }

    const game = await createGame({
      location: location.trim(),
      max_players: maxPlayersNum,
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
            <Text className="text-lg font-semibold ml-4">Create Game</Text>
          </View>
        </View>

        <View className="flex-1 px-6 py-6">
          <View className="mb-8">
            <Text className="text-2xl font-bold mb-2">Start a New Game</Text>
            <Text className="text-gray-600">
              Set up your add-on climbing session and invite friends to join!
            </Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Location *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-base"
                placeholder="e.g., Local Gym - Main Wall, Red River Gorge"
                value={location}
                onChangeText={setLocation}
                multiline
                numberOfLines={2}
              />
              <Text className="text-xs text-gray-500 mt-1">
                Be specific so players know exactly where to meet
              </Text>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Max Players
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-base"
                placeholder="6"
                value={maxPlayers}
                onChangeText={setMaxPlayers}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text className="text-xs text-gray-500 mt-1">
                Recommended: 4-6 players for best experience
              </Text>
            </View>
          </View>

          <View className="flex-1 justify-end">
            <TouchableOpacity
              className={`bg-blue-600 rounded-lg py-4 ${loading ? 'opacity-50' : ''}`}
              onPress={handleCreateGame}
              disabled={loading}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {loading ? 'Creating Game...' : 'Create Game'}
              </Text>
            </TouchableOpacity>

            <Text className="text-xs text-gray-500 text-center mt-3">
              You'll get a room code to share with other players once the game is created
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}