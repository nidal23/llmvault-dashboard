//Authentication operations
// src/lib/api/auth.ts
import { supabase } from '../supabase/client';
// import type { Provider } from '@supabase/supabase-js';

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  console.log('inside get current user')
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('sessiont user returned from get current user: ', session?.user)
  if (error) {
    console.log('ran into error in current user: ', error)
  };
  return session?.user || null;
};

export const getProfile = async (userId: string) => {
  console.log('function got called')
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

export const updateProfile = async (userId: string, updates: { 
  username?: string; 
  full_name?: string; 
  avatar_url?: string; 
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};