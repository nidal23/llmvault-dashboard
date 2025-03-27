// src/lib/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { Profile } from '../supabase/database.types';
import { getProfile } from '../api/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  initialized: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const initializationComplete = useRef(false);

  console.log(`[AuthProvider] Rendering - isLoading: ${isLoading}, initialized: ${initialized}`);
  
  useEffect(() => {
    console.log(`[AuthProvider] Initialization started`);
    
    // Get initial session
    const initializeAuth = async () => {
      if (initializationComplete.current) {
        console.log(`[AuthProvider] Initialization already completed, skipping`);
        return;
      }
      
      console.log("[AuthProvider] Setting loading state to true");
      setIsLoading(true);
      
      try {
        console.log("[AuthProvider] Fetching session from Supabase");
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthProvider] Error getting session:', error);
        } else {
          console.log("[AuthProvider] Session received", 
            currentSession ? `with user ID: ${currentSession.user?.id}` : "no user");
          
          setSession(currentSession);
          setUser(currentSession?.user || null);
          
          // If user exists, fetch their profile
          if (currentSession?.user) {
            try {
              console.log(`[AuthProvider] Fetching profile for user ${currentSession.user.id}`);
              const profileData = await getProfile(currentSession.user.id);
              setProfile(profileData);
            } catch (profileError) {
              console.error('[AuthProvider] Error fetching profile:', profileError);
            }
          }
        }
      } catch (error) {
        console.error('[AuthProvider] Error in auth initialization:', error);
      } finally {
        console.log("[AuthProvider] Setting loading=false and initialized=true");
        setIsLoading(false); // Critical: this must be false when initialized is true
        setInitialized(true);
        initializationComplete.current = true;
      }
    };

    initializeAuth();

    // Set up auth change listener
    console.log("[AuthProvider] Setting up auth state change listener");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`[AuthProvider] Auth state changed - ${event}`, 
          newSession ? `for user: ${newSession.user?.id}` : "no session");
        
        try {
          if (event === 'SIGNED_OUT') {
            // For sign out, immediately update all state
            console.log("[AuthProvider] User signed out, clearing all state");
            setUser(null);
            setSession(null);
            setProfile(null);
            setIsLoading(false);
          } else {
            // For other events, update session and user
            setSession(newSession);
            setUser(newSession?.user || null);
            
            if (event === 'SIGNED_IN' && newSession?.user) {
              console.log(`[AuthProvider] User signed in, fetching profile: ${newSession.user.id}`);
              setIsLoading(true);
              try {
                const profileData = await getProfile(newSession.user.id);
                setProfile(profileData);
              } catch (error) {
                console.error('[AuthProvider] Error fetching profile after sign in:', error);
              } finally {
                setIsLoading(false);
              }
            }
          }
        } catch (error) {
          console.error('[AuthProvider] Error handling auth change:', error);
          setIsLoading(false); // Ensure loading is reset even on error
        }
      }
    );

    // Cleanup subscription
    return () => {
      console.log("[AuthProvider] Cleanup - unsubscribing");
      subscription.unsubscribe();
    };
  }, []);

  // Manual sign out - don't rely solely on the event listener
  const signOut = async () => {
    console.log("[AuthProvider] Initiating sign-out");
    try {
      setIsLoading(true); // Start loading state
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthProvider] Sign-out error:', error);
        throw error;
      }
      
      // Force state reset even if event listener doesn't fire
      console.log("[AuthProvider] Manual state reset after sign-out");
      setUser(null);
      setSession(null);
      setProfile(null);
      
    } catch (error) {
      console.error('[AuthProvider] Error signing out:', error);
      throw error;
    } finally {
      setIsLoading(false); // Always end loading state
    }
  };

  const signInWithGoogle = async () => {
    console.log("[AuthProvider] Initiating Google sign-in");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('[AuthProvider] Sign-in error:', error);
        throw error;
      }
    } catch (error) {
      console.error('[AuthProvider] Error signing in with Google:', error);
      throw error;
    }
  };

  const fetchProfile = async (userId: string) => {
    if (!userId) return;
    
    console.log(`[AuthProvider] Fetching profile for user ${userId}`);
    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('[AuthProvider] Error fetching profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
  };
  
  // Force reset loading state after 10 seconds if it gets stuck
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        console.warn("[AuthProvider] Loading state stuck for 10 seconds, forcing reset");
        setIsLoading(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Add debug helper to reset loading
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.resetAuthLoading = () => {
      setIsLoading(false);
      console.log('[AuthProvider] Manually reset loading state from console');
    };
  }

  const value = {
    user,
    session,
    profile,
    isLoading,
    initialized,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  console.log(`[AuthProvider] State - isLoading: ${isLoading}, ` +
    `initialized: ${initialized}, ` +
    `user: ${user ? 'authenticated' : 'not authenticated'}`);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};