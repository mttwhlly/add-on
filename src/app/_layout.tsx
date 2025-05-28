// src/app/_layout.tsx - Fixed navigation setup
import '@/assets/styles/global.css';
import { AuthProvider } from '@/hooks/use-auth';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Main screens */}
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/sign-in" />
          
          {/* Game screens */}
          <Stack.Screen name="create-game" />
          <Stack.Screen name="join-game" />
          <Stack.Screen name="game/lobby/[id]" />
          <Stack.Screen name="game/[id]" />
          
          {/* Wall & Photo screens */}
          <Stack.Screen name="test-photo" />
          <Stack.Screen name="create-wall" />
          <Stack.Screen name="browse-walls" />
          <Stack.Screen name="my-walls" />
          <Stack.Screen name="wall/[id]" />
          
          {/* Route screens */}
          <Stack.Screen name="create-route" />
          <Stack.Screen name="route/[id]" />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}