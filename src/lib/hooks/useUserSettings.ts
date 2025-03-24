// src/lib/hooks/useUserSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import { UserSettings } from '../supabase/database.types';
import { toast } from 'react-hot-toast';

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch user settings
  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      
      setSettings(data);
    } catch (err) {
      console.error('Error fetching user settings:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user settings'));
      toast.error('Failed to load user settings');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load settings on component mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update user settings
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      
      setSettings(data);
      toast.success('Settings updated successfully');
      return data;
    } catch (err) {
      console.error('Error updating user settings:', err);
      toast.error('Failed to update settings');
      throw err;
    }
  }, [user]);

  // Update theme
  const updateTheme = useCallback(async (theme: 'light' | 'dark' | 'system') => {
    return updateSettings({ theme });
  }, [updateSettings]);

  // Update default labels
  const updateDefaultLabels = useCallback(async (labels: string[]) => {
    return updateSettings({ default_labels: labels });
  }, [updateSettings]);

  // Toggle platform auto-detection
  const toggleAutoDetectPlatform = useCallback(async () => {
    if (!settings) return;
    return updateSettings({ auto_detect_platform: !settings.auto_detect_platform });
  }, [settings, updateSettings]);

  return {
    settings,
    isLoading,
    error,
    refreshSettings: fetchSettings,
    updateSettings,
    updateTheme,
    updateDefaultLabels,
    toggleAutoDetectPlatform,
  };
};