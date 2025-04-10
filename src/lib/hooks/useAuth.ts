import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../supabase/client';
import { getCurrentUser, getUserProfile, UserProfile } from '../api/auth';
import { withTimeout } from '../utils/promises';

interface AuthContextType {
  isLoading: boolean;
  user: any;
  profile: UserProfile | null;
  isLoggedIn: boolean;
  refreshUser: () => Promise<void>;
}

// Create the context with a default value matching the type
const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  user: null,
  profile: null,
  isLoggedIn: false,
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [needsProfileRefresh, setNeedsProfileRefresh] = useState(false);
  
  // Effect to handle profile fetching separately from auth state changes
  useEffect(() => {
    let mounted = true;
    
    if (needsProfileRefresh && user && !isLoading) {
      const fetchProfile = async () => {
        try {
          const userProfile = await withTimeout(getUserProfile());
          if (mounted) {
            setProfile(userProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          if (mounted) setNeedsProfileRefresh(false);
        }
      };
      
      fetchProfile();
    }
    
    return () => {
      mounted = false;
    };
  }, [needsProfileRefresh, user, isLoading]);
  
  const refreshUser = async () => {
    try {
      // First try to get user from session directly
      const { data: sessionData, error: sessionError } = await withTimeout(supabase.auth.getSession());
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
      }
      
      if (sessionData?.session) {
        // If we have a session, use the user from it
        const sessionUser = sessionData.session.user;
        setUser(sessionUser);
        
        // Set flag to fetch profile in separate effect
        if (sessionUser) {
          setNeedsProfileRefresh(true);
        }
        
        // We have a session user, so we can consider auth loading complete regardless of profile
        setIsLoading(false);
        return;
      }
      
      // Fall back to getCurrentUser if no session
      try {
        const currentUser = await withTimeout(getCurrentUser());
        setUser(currentUser);
        
        if (currentUser) {
          setNeedsProfileRefresh(true);
        } else {
          setProfile(null);
        }
      } catch (userError) {
        console.error('Error getting current user:', userError);
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error in refresh user flow:', error);
      setUser(null);
      setProfile(null);
    } finally {
      // Always set loading to false, regardless of what happened
      setIsLoading(false);
    }
  };
  
  // Handle OAuth redirects and initial auth state
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      if (!mounted) return;
      setIsLoading(true);
      
      try {
        // Check for existing session directly
        const { data: sessionData, error: sessionError } = await withTimeout(supabase.auth.getSession());
        
        if (sessionError) {
          console.error('Error in initial session check:', sessionError);
        }
        
        if (sessionData?.session && mounted) {
          setUser(sessionData.session.user);
          
          // Set flag to fetch profile in separate effect
          setNeedsProfileRefresh(true);
        } else {
          console.log('No existing session found');
        }
      } catch (error) {
        console.error('Error in initialization:', error);
      } finally {
        // Always set loading to false if component is still mounted
        if (mounted) setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setIsLoading(true);
        
        if (session && mounted) {
          setUser(session.user);
          
          // Set flag to fetch profile in separate effect instead of fetching here
          setNeedsProfileRefresh(true);
          setIsLoading(false);
        } else {
          console.warn('Auth event SIGNED_IN/TOKEN_REFRESHED but no session');
          // Use setTimeout to avoid potential deadlock with refreshUser
          setTimeout(() => {
            if (mounted) {
              refreshUser().catch(error => {
                console.error('Error in refresh user after auth change:', error);
                if (mounted) setIsLoading(false);
              });
            }
          }, 0);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      } else {
        // For any other event, make sure we're not stuck in loading
        if (mounted) setIsLoading(false);
      }
    });
    
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    isLoading,
    user, 
    profile,
    isLoggedIn: !!user,
    refreshUser
  };
  
  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};