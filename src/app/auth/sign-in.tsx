// src/app/auth/sign-in.tsx - With proper navigation
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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

export default function SignIn() {
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect to home if user is already signed in
  useEffect(() => {
    console.log('SignIn screen - user:', user?.email, 'authLoading:', authLoading);
    if (!authLoading && user) {
      console.log('User is signed in, redirecting to home...');
      router.replace('/');
    }
  }, [user, authLoading]);

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !username)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Attempting auth:', { email, isSignUp });
      
      const { error } = isSignUp 
        ? await signUp(email, password, username)
        : await signIn(email, password);

      if (error) {
        console.error('Auth error details:', error);
        Alert.alert(
          'Authentication Error', 
          `${error.message}\n\nError code: ${error.code || 'unknown'}`
        );
      } else {
        console.log('Auth successful! Should redirect automatically...');
        // The useEffect above will handle the redirect when user state updates
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('Unexpected Error', 'Something went wrong. Check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg">Checking authentication...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-center mb-2">
              Add On 🧗‍♂️
            </Text>
            <Text className="text-gray-600 text-center">
              Collaborative climbing games
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Email
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-base"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {isSignUp && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Username
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-3 text-base"
                  placeholder="climber123"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            )}

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Password
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-base"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              className={`bg-blue-600 rounded-lg py-3 ${loading ? 'opacity-50' : ''}`}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text className="text-white text-center font-semibold text-base">
                {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-2"
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text className="text-blue-600 text-center">
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Success indicator */}
          <View className="mt-8 p-4 bg-green-50 rounded-lg">
            <Text className="text-green-800 text-sm text-center">
              ✅ Supabase Cloud auth is working! Try signing in and you'll be redirected to the home screen.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}