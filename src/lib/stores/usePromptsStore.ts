// src/lib/stores/usePromptsStore.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { 
  Prompt, 
  PromptInsert as DbPromptInsert, 
  PromptUpdate, 
  Bookmark, 
  Folder, 
  FolderWithCount 
} from '@/lib/supabase/database.types';

// Update the PromptsState interface in src/lib/stores/usePromptsStore.ts

interface PromptsState {
  prompts: Prompt[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations - UPDATE THESE SIGNATURES
  fetchPrompts: (userId: string) => Promise<void>;
  fetchPromptById: (id: string) => Promise<Prompt | null>;
  createPrompt: (userId: string, promptData: {
    title: string;
    content: string;
    description?: string | null;
    category?: string | null;
    tags?: string[] | null;
    is_favorite?: boolean;
    folder_id?: string | null;
  }) => Promise<Prompt>;  // UPDATED SIGNATURE
  updatePrompt: (id: string, promptData: PromptUpdate) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  
  // Actions
  toggleFavorite: (id: string) => Promise<void>;
  incrementUsage: (id: string) => Promise<void>;
  
  // Linking
  linkToBookmark: (promptId: string, bookmarkId: string) => Promise<void>;
  linkToFolder: (promptId: string, folderId: string) => Promise<void>;
  unlinkFromBookmark: (promptId: string, bookmarkId: string) => Promise<void>;
  unlinkFromFolder: (promptId: string, folderId: string) => Promise<void>;
  fetchLinkedBookmarks: (promptId: string) => Promise<Bookmark[]>;
  fetchLinkedFolders: (promptId: string) => Promise<FolderWithCount[]>;
}

export const usePromptsStore = create<PromptsState>((set, get) => ({
  prompts: [],
  isLoading: false,
  error: null,
  
  fetchPrompts: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      set({ prompts: data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching prompts:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  fetchPromptById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching prompt:', error);
      return null;
    }
  },
  
  createPrompt: async (userId: string, promptData: {
  title: string;
  content: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  is_favorite?: boolean;
  folder_id?: string | null;
  preferred_platforms?: string[] | null; // ADD THIS LINE
}) => {
  try {
    // Explicitly cast to the database's expected insert type
    const dataToInsert: DbPromptInsert = {
      title: promptData.title,
      content: promptData.content,
      user_id: userId,
      description: promptData.description || null,
      category: promptData.category || null,
      tags: promptData.tags || null,
      is_favorite: promptData.is_favorite || false,
      usage: 0,
      folder_id: promptData.folder_id || null,
      preferred_platforms: promptData.preferred_platforms || null, // ADD THIS LINE
    };
    
    const { data, error } = await supabase
      .from('prompts')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) throw error;
    
    const newPrompt = data as Prompt;
    
    set(state => ({
      prompts: [newPrompt, ...state.prompts]
    }));
    
    return newPrompt;
  } catch (error) {
    console.error('Error creating prompt:', error);
    throw error;
  }
},

  
  updatePrompt: async (id: string, promptData: Partial<Prompt>) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .update({
          ...promptData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        prompts: state.prompts.map(prompt => 
          prompt.id === id 
            ? { ...prompt, ...promptData, updated_at: new Date().toISOString() } 
            : prompt
        )
      }));
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    }
  },
  
  deletePrompt: async (id: string) => {
    try {
      // Delete linked items first
      await supabase
        .from('prompt_links')
        .delete()
        .eq('prompt_id', id);
      
      // Delete the prompt
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        prompts: state.prompts.filter(prompt => prompt.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    }
  },
  
  toggleFavorite: async (id: string) => {
    try {
      // Get current prompt
      const prompt = get().prompts.find(p => p.id === id);
      if (!prompt) throw new Error('Prompt not found');
      
      const newIsFavorite = !prompt.is_favorite;
      
      // Update in database
      const { error } = await supabase
        .from('prompts')
        .update({ is_favorite: newIsFavorite })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update in state
      set(state => ({
        prompts: state.prompts.map(prompt => 
          prompt.id === id 
            ? { ...prompt, is_favorite: newIsFavorite } 
            : prompt
        )
      }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  },
  
  incrementUsage: async (id: string) => {
    try {
      // Get current prompt
      const prompt = get().prompts.find(p => p.id === id);
      if (!prompt) throw new Error('Prompt not found');
      
      const newUsage = (prompt.usage || 0) + 1;
      
      // Update in database
      const { error } = await supabase
        .from('prompts')
        .update({ usage: newUsage })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update in state
      set(state => ({
        prompts: state.prompts.map(prompt => 
          prompt.id === id 
            ? { ...prompt, usage: newUsage } 
            : prompt
        )
      }));
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  },
  
  linkToBookmark: async (promptId: string, bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('prompt_links')
        .insert({
          prompt_id: promptId,
          bookmark_id: bookmarkId
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error linking to bookmark:', error);
      throw error;
    }
  },
  
  linkToFolder: async (promptId: string, folderId: string) => {
    try {
      const { error } = await supabase
        .from('prompt_links')
        .insert({
          prompt_id: promptId,
          folder_id: folderId
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error linking to folder:', error);
      throw error;
    }
  },
  
  unlinkFromBookmark: async (promptId: string, bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('prompt_links')
        .delete()
        .eq('prompt_id', promptId)
        .eq('bookmark_id', bookmarkId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error unlinking from bookmark:', error);
      throw error;
    }
  },
  
  unlinkFromFolder: async (promptId: string, folderId: string) => {
    try {
      const { error } = await supabase
        .from('prompt_links')
        .delete()
        .eq('prompt_id', promptId)
        .eq('folder_id', folderId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error unlinking from folder:', error);
      throw error;
    }
  },
  
  fetchLinkedBookmarks: async (promptId: string): Promise<Bookmark[]> => {
    try {
      const { data, error } = await supabase
        .from('prompt_links')
        .select(`
          bookmark_id,
          bookmarks:bookmark_id (*)
        `)
        .eq('prompt_id', promptId)
        .not('bookmark_id', 'is', null);
      
      if (error) throw error;
      
      // Extract bookmark details from the nested structure
      return data
        .filter(item => item.bookmarks)
        .map(item => item.bookmarks as Bookmark);
    } catch (error) {
      console.error('Error fetching linked bookmarks:', error);
      return [];
    }
  },
  
  fetchLinkedFolders: async (promptId: string): Promise<FolderWithCount[]> => {
    try {
      const { data, error } = await supabase
        .from('prompt_links')
        .select(`
          folder_id,
          folders:folder_id (*)
        `)
        .eq('prompt_id', promptId)
        .not('folder_id', 'is', null);
      
      if (error) throw error;
      
      // Extract folder details and add bookmarkCount if missing
      const folders = data
        .filter(item => item.folders)
        .map(item => {
          const folder = item.folders as Folder;
          // Convert to FolderWithCount by adding the bookmarkCount property if it doesn't exist
          return { 
            ...folder, 
            bookmarkCount: 0  // Default value, you might want to fetch real counts
          } as FolderWithCount;
        });
        
      // If you want to fetch the actual bookmark counts, you could do it here
      // by making an additional query for each folder, but that might be expensive
      
      return folders;
    } catch (error) {
      console.error('Error fetching linked folders:', error);
      return [];
    }
  }

}));