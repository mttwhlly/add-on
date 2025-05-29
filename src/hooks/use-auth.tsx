import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { pb } from '@/lib/pocketbase';

interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{error: any}>;
  signIn: (email: string, password: string) => Promise<{error: any}>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('PocketBase Auth: Initializing...');
    
    // Check initial auth state
    const initialUser = pb.currentUser;
    if (initialUser) {
      console.log('PocketBase Auth: Found existing user:', initialUser.email);
      setUser(initialUser);
    }
    setLoading(false);

    // Listen for auth changes
    const unsubscribe = pb.pb.authStore.onChange((token, model) => {
      console.log('PocketBase Auth: Auth state changed:', model?.email || 'signed out');
      
      if (model) {
        const user = {
          id: model.id,
          email: model.email,
          username: model.username,
          created_at: model.created,
        };
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      console.log('Auth Hook: Signing up user:', email, username);
      
      const result = await pb.signUp(email, password, username);
      
      if (result.error) {
        console.error('Auth Hook: Signup error:', result.error);
        return { error: result.error };
      }

      console.log('Auth Hook: Signup successful');
      return { error: null };
    } catch (err) {
      console.error('Auth Hook: Signup catch error:', err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Auth Hook: Signing in user:', email);
      
      const result = await pb.signIn(email, password);
      
      if (result.error) {
        console.error('Auth Hook: Signin error:', result.error);
        return { error: result.error };
      }

      console.log('Auth Hook: Signin successful');
      return { error: null };
    } catch (err) {
      console.error('Auth Hook: Signin catch error:', err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('Auth Hook: Signing out user');
    pb.signOut();
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}