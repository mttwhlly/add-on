// app/index.tsx
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Home() {
  const { user, loading, session } = useAuth();

  console.log('=== HOME SCREEN DEBUG ===');
  console.log('Home screen - user:', user);
  console.log('Home screen - loading:', loading);
  console.log('Home screen - session:', session?.user?.id);
  console.log('========================');

  useEffect(() => {
    console.log('Home useEffect - user:', user?.email, 'loading:', loading);
    if (!loading && !user) {
      console.log('No user found, redirecting to sign-in...');
      router.replace('/auth/sign-in');
    }
  }, [user, loading]);

  if (loading) {
    console.log('Home screen showing loading...');
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    console.log('No user, returning null (should redirect)...');
    return null; // Will redirect to sign-in
  }

  console.log('Rendering home screen for user:', user.email);
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold mb-2">Add On 🧗‍♂️</Text>
          <Text className="text-gray-600">Welcome back, {user.username}!</Text>
          <Text className="text-sm text-gray-400">Email: {user.email}</Text>
        </View>

        {/* Main Actions */}
        <View className="space-y-4">
          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-4 px-6"
            onPress={() => router.push('/create-game')}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Create New Game
            </Text>
            <Text className="text-blue-100 text-center text-sm mt-1">
              Start a climbing session and invite friends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-green-600 rounded-lg py-4 px-6"
            onPress={() => router.push('/join-game')}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Join Game
            </Text>
            <Text className="text-green-100 text-center text-sm mt-1">
              Enter a room code to join a session
            </Text>
          </TouchableOpacity>
        </View>

        {/* Success Message */}
        <View className="mt-8 bg-green-50 rounded-lg p-4">
          <Text className="text-green-800 font-semibold mb-2">🎉 Auth Working!</Text>
          <Text className="text-green-700 text-sm">
            Supabase Cloud authentication is now working perfectly. 
            You can create and join climbing games!
          </Text>
        </View>

        {/* Debug Info */}
        <View className="mt-4 p-4 bg-blue-50 rounded-lg">
          <Text className="text-sm font-mono text-blue-800">
            User ID: {user.id}
          </Text>
          <Text className="text-sm font-mono text-blue-800">
            Username: {user.username}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}