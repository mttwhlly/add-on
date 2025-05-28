// src/hooks/use-auth.tsx - Simplified to fix displayName error
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{error: any}>;
  signIn: (email: string, password: string) => Promise<{error: any}>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Convert Supabase user to our user format
  const createUserFromAuth = (authUser: SupabaseUser): User => {
    return {
      id: authUser.id,
      email: authUser.email || '',
      username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user',
      created_at: authUser.created_at || new Date().toISOString(),
    };
  };

  useEffect(() => {
    console.log('🔐 AuthProvider mounting...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session check:', session?.user?.email || 'No session');
      setSession(session);
      if (session?.user) {
        setUser(createUserFromAuth(session.user));
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.id);
        setSession(session);
        if (session?.user) {
          setUser(createUserFromAuth(session.user));
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      console.log('🔐 AuthProvider unmounting...');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      console.log('Signing up user:', email, username);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        return { error };
      }

      // Create user profile in users table
      if (data.user) {
        console.log('Creating user profile for:', data.user.id);
        
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              username,
              email,
            },
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          return { error: profileError };
        }
        
        console.log('User profile created successfully');
      }

      return { error: null };
    } catch (err) {
      console.error('Signup catch error:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Signin error:', error);
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('Signing out user');
    await supabase.auth.signOut();
  };

  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  console.log('🔐 AuthProvider rendering with user:', user?.email || 'No user');

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};