// src/lib/stores/useProfileStore.ts
import { create } from 'zustand';
import { getProfile, updateProfile } from '../api/profiles';
import type { Profile } from '../supabase/database.types';
import { toast } from 'sonner'; // or 'react-hot-toast' depending on your setup
import { withTimeout } from '../utils/promises';

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  lastFetchTime: number;
  
  // Actions
  fetchProfile: (userId: string, force?: boolean) => Promise<void>;
  updateProfile: (
    userId: string, 
    updates: {
      full_name?: string | null;
      username?: string | null;
      avatar_url?: string | null;
      bio?: string | null;
    }
  ) => Promise<Profile | null>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  isSaving: false,
  error: null,
  lastFetchTime: 0,
  
  fetchProfile: async (userId: string, force = false) => {
    // Skip if no user ID
    if (!userId) {
      set({ profile: null, isLoading: false });
      return;
    }
    
    // Throttle requests unless forced
    const { lastFetchTime, isLoading } = get();
    const now = Date.now();
    if (!force && !isLoading && now - lastFetchTime < 5000) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const profile = await withTimeout(getProfile(userId), 10000);
      set({ 
        profile, 
        isLoading: false, 
        lastFetchTime: Date.now(),
        error: null
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      set({ 
        isLoading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch profile')
      });
      toast.error('Failed to load profile information');
    }
  },
  
  updateProfile: async (userId: string, updates) => {
    if (!userId) {
      toast.error('User ID is required to update profile');
      return null;
    }
    
    set({ isSaving: true, error: null });
    
    try {
      const updatedProfile = await withTimeout(updateProfile(userId, updates), 10000);
      
      // Update the local state
      set({ 
        profile: updatedProfile,
        isSaving: false,
        error: null
      });
      
      toast.success('Profile updated successfully');
      return updatedProfile;
    } catch (err) {
      console.error('Error updating profile:', err);
      
      set({ 
        isSaving: false,
        error: err instanceof Error ? err : new Error('Failed to update profile')
      });
      
      toast.error('Failed to update profile');
      return null;
    }
  },
  
  clearProfile: () => {
    set({ 
      profile: null, 
      isLoading: false, 
      isSaving: false,
      error: null
    });
  }
}));