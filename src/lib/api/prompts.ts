// src/lib/api/prompts.ts - Enhanced version with folder support
import { supabase } from '../supabase/client';
import type { Prompt, PromptWithFolder } from '../supabase/database.types';

export const getPrompts = async (
  userId: string, 
  options: { 
    folderId?: string; 
    search?: string; 
    category?: string; 
    isFavorite?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<PromptWithFolder[]> => {
  const { 
    folderId, 
    search, 
    category, 
    isFavorite,
    page = 1,
    limit = 50
  } = options;
  
  // Calculate pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  // Build query with folder join
  let query = supabase
    .from('prompts')
    .select(`
      *,
      prompt_folders:prompt_folders(name)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .range(from, to);
  
  // Apply filters if provided
  if (folderId) {
    query = query.eq('folder_id', folderId);
  }
  
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,content.ilike.%${search}%`);
  }
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (isFavorite !== undefined) {
    query = query.eq('is_favorite', isFavorite);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Format prompts with folder names
  return data.map(prompt => ({
    ...prompt,
    folder_name: prompt.prompt_folders?.name,
  }));
};

export const getPrompt = async (userId: string, promptId: string): Promise<PromptWithFolder> => {
  const { data, error } = await supabase
    .from('prompts')
    .select(`
      *,
      prompt_folders:prompt_folders(name)
    `)
    .eq('id', promptId)
    .eq('user_id', userId)
    .single();
    
  if (error) throw error;
  
  return {
    ...data,
    folder_name: data.prompt_folders?.name,
  };
};

export const createPrompt = async (userId: string, prompt: {
  title: string;
  content: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  is_favorite?: boolean;
  folder_id?: string | null;
  preferred_platforms?: string[] | null;
}): Promise<Prompt> => {
  const { data, error } = await supabase
    .from('prompts')
    .insert({
      ...prompt,
      user_id: userId,
      usage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) {
    // You can add prompt limits here if needed
    throw error;
  }
  
  return data;
};

export const updatePrompt = async (userId: string, promptId: string, updates: {
  title?: string;
  content?: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  is_favorite?: boolean;
  folder_id?: string | null;
  preferred_platforms?: string[] | null;
}): Promise<Prompt> => {
  const { data, error } = await supabase
    .from('prompts')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', promptId)
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const deletePrompt = async (userId: string, promptId: string): Promise<void> => {
  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', promptId)
    .eq('user_id', userId);
    
  if (error) throw error;
};

export const incrementPromptUsage = async (userId: string, promptId: string): Promise<void> => {
  // First, get the current usage count
  const { data: currentPrompt, error: fetchError } = await supabase
    .from('prompts')
    .select('usage')
    .eq('id', promptId)
    .eq('user_id', userId)
    .single();
    
  if (fetchError) throw fetchError;
  
  // Then update with incremented value
  const { error } = await supabase
    .from('prompts')
    .update({ 
      usage: (currentPrompt.usage || 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', promptId)
    .eq('user_id', userId);
    
  if (error) throw error;
};
