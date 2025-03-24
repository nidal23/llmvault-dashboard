//Bookmarks crud operations

// src/lib/api/bookmarks.ts
import { supabase } from '../supabase/client';
import type { Bookmark, BookmarkWithFolder } from '../supabase/database.types';

export const getBookmarks = async (
  userId: string, 
  options: { 
    folderId?: string; 
    search?: string; 
    platform?: string; 
    label?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<BookmarkWithFolder[]> => {
  const { 
    folderId, 
    search, 
    platform, 
    label,
    page = 1,
    limit = 50
  } = options;
  
  // Calculate pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  // Build query
  let query = supabase
    .from('bookmarks')
    .select(`
      *,
      folders:folders(name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  
  // Apply filters if provided
  if (folderId) {
    query = query.eq('folder_id', folderId);
  }
  
  if (search) {
    query = query.or(`title.ilike.%${search}%,notes.ilike.%${search}%`);
  }
  
  if (platform) {
    query = query.eq('platform', platform);
  }
  
  if (label) {
    query = query.eq('label', label);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Format bookmarks with folder names
  return data.map(bookmark => ({
    ...bookmark,
    folder_name: bookmark.folders?.name,
  }));
};

export const getBookmark = async (userId: string, bookmarkId: string): Promise<BookmarkWithFolder> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      folders:folders(name)
    `)
    .eq('id', bookmarkId)
    .eq('user_id', userId)
    .single();
    
  if (error) throw error;
  
  return {
    ...data,
    folder_name: data.folders?.name,
  };
};

export const createBookmark = async (userId: string, bookmark: {
  folder_id: string;
  url: string;
  title: string;
  label?: string | null;
  platform?: string | null;
  notes?: string | null;
}): Promise<Bookmark> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      ...bookmark,
      user_id: userId,
    })
    .select()
    .single();
    
    if (error) {
        // Check if the error is from the trigger 'check_bookmark_limit'
        if (error.message.includes('Free tier users are limited to 30 bookmarks')) {
          throw new Error('Free tier users are limited to 30 bookmarks');
        }
        throw error;
      }  
  return data;
};

export const updateBookmark = async (userId: string, bookmarkId: string, updates: {
  folder_id?: string;
  url?: string;
  title?: string;
  label?: string | null;
  platform?: string | null;
  notes?: string | null;
}): Promise<Bookmark> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .update(updates)
    .eq('id', bookmarkId)
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const deleteBookmark = async (userId: string, bookmarkId: string): Promise<void> => {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId)
    .eq('user_id', userId);
    
  if (error) throw error;
};

export const getBookmarkStats = async (userId: string): Promise<{
  totalCount: number;
  byPlatform: Record<string, number>;
  byLabel: Record<string, number>;
  recentCount: number;
}> => {
  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
    
  if (countError) throw countError;
  
  // Get all bookmarks for platform and label stats
  const { data: allBookmarks, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select('platform, label')
    .eq('user_id', userId);
    
  if (bookmarksError) throw bookmarksError;
  
  // Calculate platform stats
  const byPlatform: Record<string, number> = {};
  allBookmarks.forEach(bookmark => {
    const platform = bookmark.platform || 'unknown';
    byPlatform[platform] = (byPlatform[platform] || 0) + 1;
  });
  
  // Calculate label stats
  const byLabel: Record<string, number> = {};
  allBookmarks.forEach(bookmark => {
    if (bookmark.label) {
      byLabel[bookmark.label] = (byLabel[bookmark.label] || 0) + 1;
    }
  });
  
  // Get recent count (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { count: recentCount, error: recentError } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString());
    
  if (recentError) throw recentError;
  
  return {
    totalCount: totalCount || 0,
    byPlatform,
    byLabel,
    recentCount: recentCount || 0,
  };
};