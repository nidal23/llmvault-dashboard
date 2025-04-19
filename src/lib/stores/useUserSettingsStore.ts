import { create } from 'zustand';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import { UserSettings, PlatformWithColor, Json } from '../supabase/database.types';

type UserSettingsState = {
  settings: UserSettings | null;
  isLoading: boolean;
  error: Error | null;
  fetchSettings: (userId: string) => Promise<void>;
  updateTheme: (userId: string, theme: string) => Promise<void>;
  updateDefaultLabels: (userId: string, labels: string[]) => Promise<void>;
  updatePlatforms: (userId: string, platforms: PlatformWithColor[]) => Promise<void>;
  toggleAutoDetectPlatform: (userId: string) => Promise<void>;
  getTheme: () => string;
  setThemeInDOM: (theme: string) => void;
};

export const useUserSettingsStore = create<UserSettingsState>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) throw error;
      
      // If no settings found, create default settings
      if (!data) {
        const defaultPlatforms = [
          { name: "ChatGPT", color: "#10A37F" },
          { name: "Claude", color: "#8C5AF2" },
          { name: "Deepseek", color: "#0066FF" },
          { name: "Gemini", color: "#AA5A44" },
          { name: "Perplexity", color: "#61C7FA" }
        ];
        
        // Detect system preference for theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const defaultTheme = prefersDark ? 'dark' : 'light';
        
        const defaultSettings = {
          user_id: userId,
          theme: defaultTheme,
          auto_detect_platform: true,
          default_labels: [] as Json,
          platforms: defaultPlatforms as unknown as Json
        };
        
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert(defaultSettings)
          .select()
          .single();
          
        if (createError) throw createError;
        
        // Apply theme to DOM
        get().setThemeInDOM(defaultTheme);
        
        // Store in localStorage
        localStorage.setItem('user-theme', defaultTheme);
        
        set({ settings: newSettings, isLoading: false });
      } else {
        // Convert legacy platforms format if needed
        const updatedData = { ...data };
        
        if (data.platforms && Array.isArray(data.platforms)) {
          // Use a more specific type without requiring JsonValue
          const platforms = data.platforms as (string | number | boolean | object)[];
          
          // Check if the first item is a string (legacy format)
          if (platforms.length > 0 && typeof platforms[0] === 'string') {
            const defaultColors: Record<string, string> = {
              "chatgpt": "#10A37F",
              "claude": "#8C5AF2",
              "deepseek": "#0066FF", 
              "gemini": "#AA5A44",
              "perplexity": "#61C7FA"
            };
            
            // Convert to new format
            const convertedPlatforms = platforms.map((name) => {
              const nameStr = typeof name === 'string' ? name : String(name);
              const lowerName = nameStr.toLowerCase();
              const color = defaultColors[lowerName] || "#808080";
              return { name: nameStr, color };
            }) as unknown as Json;
            
            // Update the platforms in the database
            const { error: updateError } = await supabase
              .from('user_settings')
              .update({ platforms: convertedPlatforms })
              .eq('user_id', userId);
              
            if (!updateError) {
              updatedData.platforms = convertedPlatforms;
            }
          }
        }
        
        // Apply theme to DOM
        if (updatedData.theme) {
          get().setThemeInDOM(updatedData.theme);
          
          // Store in localStorage
          localStorage.setItem('user-theme', updatedData.theme);
        }
        
        set({ settings: updatedData, isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to load settings');
    }
  },

  updateTheme: async (userId: string, theme: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('user_settings')
        .update({ theme })
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Apply theme to DOM
      get().setThemeInDOM(theme);
      
      // Store in localStorage for persistence between sessions
      localStorage.setItem('user-theme', theme);
      
      // Update local state
      set((state) => {
        if (!state.settings) return { isLoading: false };
        return { 
          settings: { 
            ...state.settings, 
            theme 
          }, 
          isLoading: false 
        };
      });
      
      toast.success('Theme updated successfully');
    } catch (error) {
      console.error('Error updating theme:', error);
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to update theme');
    }
  },

  updateDefaultLabels: async (userId: string, default_labels: string[]) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('user_settings')
        .update({ default_labels: default_labels as unknown as Json })
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Update local state
      set((state) => {
        if (!state.settings) return { isLoading: false };
        return { 
          settings: { 
            ...state.settings, 
            default_labels: default_labels as unknown as Json
          }, 
          isLoading: false 
        };
      });
      
      toast.success('Labels updated successfully');
    } catch (error) {
      console.error('Error updating labels:', error);
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to update labels');
    }
  },

  updatePlatforms: async (userId: string, platforms: PlatformWithColor[]) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('user_settings')
        .update({ platforms: platforms as unknown as Json })
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Update local state
      set((state) => {
        if (!state.settings) return { isLoading: false };
        return { 
          settings: { 
            ...state.settings, 
            platforms: platforms as unknown as Json
          }, 
          isLoading: false 
        };
      });
      
      toast.success('Platforms updated successfully');
    } catch (error) {
      console.error('Error updating platforms:', error);
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to update platforms');
    }
  },

  toggleAutoDetectPlatform: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Toggle the current value
      const currentValue = get().settings?.auto_detect_platform;
      const newValue = currentValue === false; // Default is true if null
      
      const { error } = await supabase
        .from('user_settings')
        .update({ auto_detect_platform: newValue })
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Update local state
      set((state) => {
        if (!state.settings) return { isLoading: false };
        return { 
          settings: { 
            ...state.settings, 
            auto_detect_platform: newValue 
          }, 
          isLoading: false 
        };
      });
      
      toast.success(`Platform auto-detection ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating auto-detect setting:', error);
      set({ error: error as Error, isLoading: false });
      toast.error('Failed to update setting');
    }
  },

  // Utility method to get current theme (from store or fallback to localStorage)
  getTheme: () => {
    const state = get();
    
    // First check store
    if (state.settings?.theme) {
      return state.settings.theme;
    }
    
    // Then check localStorage
    const storedTheme = localStorage.getItem('user-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
    
    // Finally check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  },

  // Utility method to apply theme to DOM
  setThemeInDOM: (theme: string) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }
}));