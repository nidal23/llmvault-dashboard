//Folder CRUD operations
// src/lib/api/folders.ts
import { supabase } from '../supabase/client';
import type { Folder, FolderWithCount } from '../supabase/database.types';

export const getFolders = async (userId: string): Promise<FolderWithCount[]> => {
  console.log('in here get folders')
  const { data, error } = await supabase
    .from('folders')
    .select(`
      id, 
      name, 
      parent_id, 
      created_at,
      user_id,
      bookmarks:bookmarks(count)
    `)
    .eq('user_id', userId)
    .order('name');
    
  if (error) throw error;
  
  // Format folders with bookmark counts
  return data.map(folder => ({
    id: folder.id,
    user_id: folder.user_id,
    name: folder.name,
    parent_id: folder.parent_id,
    created_at: folder.created_at,
    bookmarkCount: folder.bookmarks?.[0]?.count || 0,
  }));
};

export const getFolder = async (userId: string, folderId: string): Promise<FolderWithCount> => {
  const { data, error } = await supabase
    .from('folders')
    .select(`
      id, 
      name, 
      parent_id, 
      created_at,
      user_id,
      bookmarks:bookmarks(count)
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
    bookmarkCount: data.bookmarks?.[0]?.count || 0,
  };
};

export const createFolder = async (userId: string, name: string, parentId: string | null = null): Promise<Folder> => {
  const { data, error } = await supabase
    .from('folders')
    .insert({ name, parent_id: parentId, user_id: userId })
    .select()
    .single();
    
    if (error) {
        // Check if the error is from the trigger 'check_folder_limit'
        if (error.message.includes('Free tier users are limited to 5 folders')) {
          throw new Error('Free tier users are limited to 5 folders');
        }
        throw error;
      }
  return data;
};

export const updateFolder = async (userId: string, folderId: string, updates: { 
  name?: string; 
  parent_id?: string | null;
}): Promise<Folder> => {
  const { data, error } = await supabase
    .from('folders')
    .update(updates)
    .eq('id', folderId)
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const deleteFolder = async (userId: string, folderId: string): Promise<void> => {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId)
    .eq('user_id', userId);
    
  if (error) throw error;
};

// Helper function to build folder hierarchy
export const buildFolderTree = (folders: FolderWithCount[]): FolderWithCount[] => {
  const map = new Map<string, FolderWithCount>();
  const roots: FolderWithCount[] = [];

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