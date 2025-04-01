// src/lib/hooks/useUserSettings.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase/client';
import { UserSettings } from '../supabase/database.types';
import { toast } from 'react-hot-toast';

interface UseUserSettingsOptions {
  initialData?: UserSettings | null;
  autoFetch?: boolean;
}

export const useUserSettings = (options: UseUserSettingsOptions = {}) => {
  const {
    initialData = null,
    autoFetch = true
  } = options;
  
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(initialData);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const firstLoadComplete = useRef(false);
  const fetchingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safety mechanism to reset isFetching if it gets stuck
  useEffect(() => {
    // Clear any existing timeout when isFetching changes
    if (fetchingTimeoutRef.current) {
      clearTimeout(fetchingTimeoutRef.current);
      fetchingTimeoutRef.current = null;
    }
    
    // If we're fetching, set a timeout to force reset it
    if (isFetching) {
      console.log('[useUserSettings] Setting safety timeout for isFetching');
      fetchingTimeoutRef.current = setTimeout(() => {
        console.warn('[useUserSettings] Force resetting isFetching after timeout');
        setIsFetching(false);
      }, 8000); // 8 second timeout
    }
    
    return () => {
      if (fetchingTimeoutRef.current) {
        clearTimeout(fetchingTimeoutRef.current);
      }
    };
  }, [isFetching]);

  // Fetch user settings
  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(initialData);
      setIsLoading(false);
      setIsFetching(false); // Ensure this is reset
      firstLoadComplete.current = true;
      return;
    }

    // Skip if already fetching, but don't get stuck
    if (isFetching) {
      console.log('[useUserSettings] Already fetching, skipping new fetch');
      return;
    }

    console.log('[useUserSettings] Starting to fetch settings');
    setIsFetching(true);
    if (!firstLoadComplete.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      
      console.log('[useUserSettings] Settings fetched successfully');
      setSettings(data);
      firstLoadComplete.current = true;
    } catch (err) {
      console.error('[useUserSettings] Error fetching user settings:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user settings'));
      
      // Only show toast error if this is the initial load
      if (!firstLoadComplete.current) {
        toast.error('Failed to load user settings');
      }
    } finally {
      console.log('[useUserSettings] Resetting loading states');
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [user, initialData]);

  // Load settings when auth is initialized
  useEffect(() => {
    console.log(`[useUserSettings] Auth initialized: ${user}, autoFetch: ${autoFetch}`);
    if (autoFetch && user) {
      fetchSettings();
    }
  }, [autoFetch, user, fetchSettings]);

  // Update user settings with optimistic updates
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) throw new Error('User not authenticated');
    
    console.log('[useUserSettings] Updating settings:', updates);
    // Skip if already fetching to prevent race conditions
    if (isFetching) {
      console.warn('[useUserSettings] Already fetching, cancelling update');
      throw new Error('Operation in progress, please try again');
    }

    // Store original settings for rollback
    const originalSettings = settings;
    
    // Apply optimistic update
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
    
    setIsFetching(true);

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('[useUserSettings] Settings updated successfully');
      setSettings(data);
      toast.success('Settings updated successfully');
      return data;
    } catch (err) {
      console.error('[useUserSettings] Error updating user settings:', err);
      
      // Rollback on error
      setSettings(originalSettings);
      
      toast.error('Failed to update settings');
      throw err;
    } finally {
      console.log('[useUserSettings] Resetting isFetching after update');
      setIsFetching(false);
    }
  }, [user, settings, isFetching]);

  // Update theme with optimistic update
  const updateTheme = useCallback(async (theme: 'light' | 'dark' | 'system') => {
    console.log(`[useUserSettings] Updating theme to: ${theme}`);
    return updateSettings({ theme });
  }, [updateSettings]);

  // Update default labels with optimistic update
  const updateDefaultLabels = useCallback(async (labels: string[]) => {
    console.log(`[useUserSettings] Updating labels, count: ${labels.length}`);
    return updateSettings({ default_labels: labels });
  }, [updateSettings]);

  // Toggle platform auto-detection with optimistic update
  const toggleAutoDetectPlatform = useCallback(async () => {
    if (!settings) return null;
    console.log(`[useUserSettings] Toggling auto-detect from: ${settings.auto_detect_platform}`);
    return updateSettings({ auto_detect_platform: !settings.auto_detect_platform });
  }, [settings, updateSettings]);

  // Log current state for debugging
  useEffect(() => {
    console.log(`[useUserSettings] State updated - isLoading: ${isLoading}, isFetching: ${isFetching}`);
  }, [isLoading, isFetching]);

  return {
    settings,
    isLoading,
    isFetching,
    error,
    refreshSettings: fetchSettings,
    updateSettings,
    updateTheme,
    updateDefaultLabels,
    toggleAutoDetectPlatform,
  };
};