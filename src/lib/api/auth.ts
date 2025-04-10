
// src/lib/api/auth.ts
import { supabase } from '../supabase/client';
export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  username?: string;
}

export async function signInWithGoogle(): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    }
  });
  
  return { data, error };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<any> {
  try {
    const response = await supabase.auth.getUser();
    
    if (response.error) {
      console.error('Error in getUser response:', response.error);
      return null;
    }
    
    return response.data.user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  // If this is a first-time login, create a profile
  if (!data) {
    return createInitialUserProfile(user);
  }
  
  return {
    id: data.id,
    email: user.email,
    fullName: data.full_name || undefined,
    avatarUrl: data.avatar_url || undefined,
    username: data.username || undefined
  };
}

async function createInitialUserProfile(user: any): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
  
  return {
    id: data.id,
    email: user.email,
    fullName: data.full_name || undefined,
    avatarUrl: data.avatar_url || undefined,
    username: data.username || undefined
  };
}

export async function updateUserProfile(profile: Partial<Omit<UserProfile, 'id' | 'email'>>): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: profile.fullName,
      avatar_url: profile.avatarUrl,
      username: profile.username,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
  
  return {
    id: data.id,
    email: user.email,
    fullName: data.full_name || undefined,
    avatarUrl: data.avatar_url || undefined,
    username: data.username || undefined
  };
}