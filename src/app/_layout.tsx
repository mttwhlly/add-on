// app/_layout.tsx
import '@/assets/styles/global.css';
import { AuthProvider } from '@/hooks/use-auth';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/sign-in" />
        <Stack.Screen name="create-game" />
        <Stack.Screen name="join-game" />
        <Stack.Screen name="game/lobby/[id]" />
        <Stack.Screen name="game/[id]" />
      </Stack>
    </AuthProvider>
  );
}