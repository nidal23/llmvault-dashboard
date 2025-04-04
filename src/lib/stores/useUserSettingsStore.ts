// src/lib/stores/useUserSettingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../supabase/client';
import { UserSettings } from '../supabase/database.types';
import { toast } from 'react-hot-toast';

interface UserSettingsState {
  // Data
  settings: UserSettings | null;
  
  // UI state
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  fetchSettings: (userId: string) => Promise<void>;
  updateSettings: (userId: string, updates: Partial<UserSettings>) => Promise<UserSettings | null>;
  updateTheme: (userId: string, theme: 'light' | 'dark' | 'system') => Promise<UserSettings | null>;
  updateDefaultLabels: (userId: string, labels: string[]) => Promise<UserSettings | null>;
  updatePlatforms: (userId: string, platforms: string[]) => Promise<UserSettings | null>;
  toggleAutoDetectPlatform: (userId: string) => Promise<UserSettings | null>;
}

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: null,
      isLoading: false,
      error: null,
      
      // Fetch user settings
      fetchSettings: async (userId: string) => {
        if (!userId) {
          set({ settings: null, isLoading: false });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (error) throw error;
          
          // Initialize default platforms if not set
          if (!data.platforms) {
            const defaultPlatforms = ["ChatGPT", "Claude", "Deepseek", "Gemini"];
            const { data: updatedData, error: updateError } = await supabase
              .from('user_settings')
              .update({ platforms: defaultPlatforms })
              .eq('user_id', userId)
              .select()
              .single();
              
            if (updateError) throw updateError;
            set({ settings: updatedData, isLoading: false });
          } else {
            set({ settings: data, isLoading: false });
          }
        } catch (err) {
          console.error('Error fetching user settings:', err);
          set({ 
            error: err instanceof Error ? err : new Error('Failed to fetch user settings'),
            isLoading: false
          });
          toast.error('Failed to load user settings');
        }
      },
      
      // Update user settings with optimistic updates
      updateSettings: async (userId: string, updates: Partial<UserSettings>) => {
        if (!userId) return null;
        
        // Store original settings for rollback
        const originalSettings = get().settings;
        
        // Apply optimistic update
        if (originalSettings) {
          set({ settings: { ...originalSettings, ...updates } });
        }
        
        try {
          // Pass a function that returns the Promise
          const { data, error } = await supabase
              .from('user_settings')
              .update(updates)
              .eq('user_id', userId)
              .select()
              .single();

        
          if (error) throw error;
          
          set({ settings: data });
          toast.success('Settings updated successfully');
          return data;
        } catch (err) {
          console.error('Error updating user settings:', err);
          
          // Rollback on error
          set({ settings: originalSettings });
          toast.error('Failed to update settings');
          return null;
        }
      },
      
      // Update theme with optimistic update
      updateTheme: async (userId: string, theme: 'light' | 'dark' | 'system') => {
        return get().updateSettings(userId, { theme });
      },
      
      // Update default labels with optimistic update
      updateDefaultLabels: async (userId: string, labels: string[]) => {
        return get().updateSettings(userId, { default_labels: labels });
      },
      
      // Update platforms with optimistic update
      updatePlatforms: async (userId: string, platforms: string[]) => {
        return get().updateSettings(userId, { platforms });
      },
      
      // Toggle platform auto-detection with optimistic update
      toggleAutoDetectPlatform: async (userId: string) => {
        const settings = get().settings;
        if (!settings) return null;
        
        return get().updateSettings(userId, { 
          auto_detect_platform: !settings.auto_detect_platform 
        });
      },
    }),
    {
      name: 'user-settings-storage',
      partialize: (state) => ({ 
        settings: state.settings 
      }),
    }
  )
);