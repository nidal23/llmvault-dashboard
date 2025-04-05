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

// src/lib/api/bookmarks.ts

/**
 * Get bookmark statistics for a user
 * 
 * @param userId The ID of the user
 * @returns Bookmark statistics including counts, recent activity, etc.
 */
export const getBookmarkStats = async (userId: string): Promise<{
totalCount: number;
byPlatform: Record<string, number>;
byLabel: Record<string, number>;
recentCount: number;
folderCount?: number;
}> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // First, get the usage stats which includes both bookmark and folder counts
  const { data: usageStats, error: usageStatsError } = await supabase
    .from('usage_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (usageStatsError) {
    console.error('Error fetching usage stats:', usageStatsError);
    // Continue with the function, we'll set defaults
  }

  // Get recent bookmarks count (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString();

  const { count: recentCount, error: recentError } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgoStr);

  if (recentError) {
    console.error('Error fetching recent bookmarks count:', recentError);
    throw recentError;
  }

  // Get bookmark counts by platform
  const { data: platformData, error: platformError } = await supabase
    .from('bookmarks')
    .select('platform')
    .eq('user_id', userId)
    .not('platform', 'is', null);

  if (platformError) {
    console.error('Error fetching platform stats:', platformError);
    throw platformError;
  }

  const byPlatform: Record<string, number> = {};
  platformData.forEach(item => {
    if (item.platform) {
      byPlatform[item.platform] = (byPlatform[item.platform] || 0) + 1;
    }
  });

  // Get bookmark counts by label
  const { data: labelData, error: labelError } = await supabase
    .from('bookmarks')
    .select('label')
    .eq('user_id', userId)
    .not('label', 'is', null);

  if (labelError) {
    console.error('Error fetching label stats:', labelError);
    throw labelError;
  }

  const byLabel: Record<string, number> = {};
  labelData.forEach(item => {
    if (item.label) {
      byLabel[item.label] = (byLabel[item.label] || 0) + 1;
    }
  });

  return {
    totalCount: usageStats?.bookmark_count || 0,
    folderCount: usageStats?.folder_count || 0, // Include folder count from usage stats
    recentCount: recentCount || 0,
    byPlatform,
    byLabel
  };
};