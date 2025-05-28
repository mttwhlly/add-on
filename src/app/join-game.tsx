// src/app/join-game.tsx - Enhanced with better feedback
import { useGame } from '@/hooks/use-game';
import { ToastNotification } from '@/components/toast-notification';
import { useToast } from '@/hooks/use-toast';
import { router } from 'expo-router';
import { useState, useRef } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';

export default function JoinGame() {
  const { joinGame, loading } = useGame();
  const { toast, showError, showSuccess, showWarning, hideToast } = useToast();
  const [roomCode, setRoomCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const validateRoomCode = (code: string) => {
    // Room codes should be 6 alphanumeric characters
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return cleanCode.length === 6;
  };

  const shakeInput = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleRoomCodeChange = (text: string) => {
    // Auto-format and validate
    const cleanCode = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(cleanCode);
    
    // Show validation feedback
    if (cleanCode.length === 6) {
      setIsValidating(true);
      // Simulate quick validation
      setTimeout(() => setIsValidating(false), 500);
    }
  };

  const handleJoinGame = async () => {
    const cleanCode = roomCode.trim().toUpperCase();
    
    if (!cleanCode) {
      showError('Please enter a room code');
      shakeInput();
      return;
    }

    if (!validateRoomCode(cleanCode)) {
      showError('Room code must be 6 characters long');
      shakeInput();
      return;
    }

    console.log('Attempting to join game with code:', cleanCode);

    try {
      const game = await joinGame({
        room_code: cleanCode,
        username: '', // Username comes from auth context
      });

      if (game) {
        showSuccess(`Joined game at ${game.location}!`);
        // Small delay to show success message
        setTimeout(() => {
          router.replace(`/game/lobby/${game.id}`);
        }, 1000);
      } else {
        showError('Failed to join game. Check the room code and try again.');
        shakeInput();
      }
    } catch (error: any) {
      console.error('Join game error:', error);
      showError(error.message || 'Failed to join game');
      shakeInput();
    }
  };

  const isValidCode = validateRoomCode(roomCode);

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
            
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <TextInput
                className={`border-2 rounded-lg px-4 py-4 text-xl font-mono text-center tracking-widest ${
                  roomCode.length === 0 
                    ? 'border-gray-300' 
                    : isValidCode 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-red-500 bg-red-50'
                }`}
                placeholder="ABC123"
                value={roomCode}
                onChangeText={handleRoomCodeChange}
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
                autoComplete="off"
                autoCorrect={false}
              />
            </Animated.View>

            <View className="flex-row items-center justify-between mt-2">
              <Text className={`text-xs ${
                roomCode.length === 0 
                  ? 'text-gray-500' 
                  : isValidCode 
                    ? 'text-green-600' 
                    : 'text-red-600'
              }`}>
                {roomCode.length === 0 
                  ? 'Room codes are 6 characters long' 
                  : isValidCode 
                    ? '✅ Valid room code format' 
                    : `${roomCode.length}/6 characters`
                }
              </Text>
              
              {isValidating && (
                <Text className="text-blue-600 text-xs">🔄 Checking...</Text>
              )}
            </View>
          </View>

          {/* Quick tips */}
          <View className="bg-blue-50 rounded-lg p-4 mb-8">
            <Text className="text-blue-800 font-medium mb-2">💡 Tips:</Text>
            <Text className="text-blue-700 text-sm">
              • Room codes are case-insensitive{'\n'}
              • Make sure you're at the same climbing location{'\n'}
              • Ask the host to share the code if you don't have it
            </Text>
          </View>

          <View className="flex-1 justify-end">
            <TouchableOpacity
              className={`rounded-lg py-4 ${
                (loading || !isValidCode) 
                  ? 'bg-gray-400' 
                  : 'bg-green-600'
              }`}
              onPress={handleJoinGame}
              disabled={loading || !isValidCode}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {loading ? 'Joining Game...' : 'Join Game'}
              </Text>
            </TouchableOpacity>

            <Text className="text-xs text-gray-500 text-center mt-3">
              You'll be taken to the game lobby once you join
            </Text>
          </View>
        </View>

        {/* Toast notifications */}
        <ToastNotification
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onHide={hideToast}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}