// src/lib/api/promptFolders.ts
import { supabase } from '../supabase/client';
import type { PromptFolder, PromptFolderWithCount } from '../supabase/database.types';

export const getPromptFolders = async (userId: string): Promise<PromptFolderWithCount[]> => {
  const { data, error } = await supabase
    .from('prompt_folders')
    .select(`
      id, 
      name, 
      parent_id, 
      created_at,
      updated_at,
      user_id,
      prompts:prompts(count)
    `)
    .eq('user_id', userId)
    .order('name');
    
  if (error) throw error;
  
  // Format folders with prompt counts
  return data.map(folder => ({
    id: folder.id,
    user_id: folder.user_id,
    name: folder.name,
    parent_id: folder.parent_id,
    created_at: folder.created_at,
    updated_at: folder.updated_at,
    promptCount: folder.prompts?.[0]?.count || 0,
  }));
};

export const getPromptFolder = async (userId: string, folderId: string): Promise<PromptFolderWithCount> => {
  const { data, error } = await supabase
    .from('prompt_folders')
    .select(`
      id, 
      name, 
      parent_id, 
      created_at,
      updated_at,
      user_id,
      prompts:prompts(count)
    `)
    .eq('id', folderId)
    .eq('user_id', userId)
    .single();
    
  if (error) throw error;
  
  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    parent_id: data.parent_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    promptCount: data.prompts?.[0]?.count || 0,
  };
};

export const createPromptFolder = async (userId: string, name: string, parentId: string | null = null): Promise<PromptFolder> => {
  const { data, error } = await supabase
    .from('prompt_folders')
    .insert({ 
      name, 
      parent_id: parentId, 
      user_id: userId,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) {
    // You can add folder limits here if needed, similar to regular folders
    throw error;
  }
  
  return data;
};

export const updatePromptFolder = async (userId: string, folderId: string, updates: { 
  name?: string; 
  parent_id?: string | null;
}): Promise<PromptFolder> => {
  const { data, error } = await supabase
    .from('prompt_folders')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', folderId)
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const deletePromptFolder = async (userId: string, folderId: string): Promise<void> => {
  const { error } = await supabase
    .from('prompt_folders')
    .delete()
    .eq('id', folderId)
    .eq('user_id', userId);
    
  if (error) throw error;
};

// Helper function to build folder hierarchy (same logic as regular folders)
export const buildPromptFolderTree = (folders: PromptFolderWithCount[]): PromptFolderWithCount[] => {
  const map = new Map<string, PromptFolderWithCount>();
  const roots: PromptFolderWithCount[] = [];

  // First pass: map all folders by ID
  folders.forEach(folder => {
    map.set(folder.id, { ...folder, children: [] });
  });

  // Second pass: build hierarchy
  folders.forEach(folder => {
    const node = map.get(folder.id)!;
    if (folder.parent_id) {
      const parent = map.get(folder.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
};