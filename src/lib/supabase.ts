// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file and app.config.js');
}

// Check if we're in a browser environment
const isClient = typeof window !== 'undefined';

// Create different storage configs for different platforms
const getStorage = () => {
  // For React Native
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return AsyncStorage;
  }
  
  // For web (browser)
  if (isClient) {
    return {
      getItem: (key: string) => {
        return Promise.resolve(localStorage.getItem(key));
      },
      setItem: (key: string, value: string) => {
        return Promise.resolve(localStorage.setItem(key, value));
      },
      removeItem: (key: string) => {
        return Promise.resolve(localStorage.removeItem(key));
      },
    };
  }
  
  // For server-side rendering (no storage)
  return {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Disable realtime to avoid ws dependency issues
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
  db: {
    schema: 'public',
  },
  // Add global configuration to prevent websocket usage
  global: {
    fetch: fetch,
  },
});

// Room code generator function
export const generateRoomCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};