//Bookmark-related hooks

// src/lib/hooks/useBookmarks.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBookmarks, createBookmark, updateBookmark, deleteBookmark } from '../api/bookmarks';
import { Bookmark, BookmarkWithFolder } from '../supabase/database.types';
import { toast } from 'react-hot-toast';

interface BookmarkFilters {
  folderId?: string;
  search?: string;
  platform?: string;
  label?: string;
}

export const useBookmarks = (initialFilters: BookmarkFilters = {}) => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkWithFolder[]>([]);
  const [filters, setFilters] = useState<BookmarkFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 30; // Number of bookmarks per page

  // Fetch bookmarks based on filters
  const fetchBookmarks = useCallback(async (resetPagination = true) => {
    if (!user) {
      setBookmarks([]);
      setIsLoading(false);
      return;
    }

    const currentPage = resetPagination ? 1 : page;
    
    if (resetPagination) {
      setPage(1);
      setBookmarks([]);
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getBookmarks(user.id, {
        ...filters,
        page: currentPage,
        limit,
      });
      
      if (resetPagination) {
        setBookmarks(data);
      } else {
        setBookmarks(prev => [...prev, ...data]);
      }
      
      // Update pagination state
      setHasMore(data.length === limit);
      setPage(currentPage);
      
      // Set total count based on first page fetch
      if (currentPage === 1) {
        // This isn't an exact count, but gives a rough idea
        setTotalCount(data.length < limit ? data.length : data.length * 2);
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch bookmarks'));
      toast.error('Failed to load bookmarks');
    } finally {
      setIsLoading(false);
    }
  }, [user, filters, page, limit]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<BookmarkFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Load next page
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);

  // Load bookmarks when filters or page changes
  useEffect(() => {
    fetchBookmarks(true);
  }, [filters]);

  useEffect(() => {
    if (page > 1) {
      fetchBookmarks(false);
    }
  }, [page]);

  // Create a new bookmark
  const handleCreateBookmark = useCallback(async (data: {
    folder_id: string;
    url: string;
    title: string;
    label?: string | null;
    platform?: string | null;
    notes?: string | null;
  }) => {
    if (!user) throw new Error('User not authenticated');
  
    try {
      // The database has a trigger that checks the bookmark limit for free tier users
      // It will throw an error if the limit is reached
      const newBookmark = await createBookmark(user.id, data);
      
      // Update local state if the bookmark matches current filters
      const matchesFilters = (
        (!filters.folderId || newBookmark.folder_id === filters.folderId) &&
        (!filters.platform || newBookmark.platform === filters.platform) &&
        (!filters.label || newBookmark.label === filters.label)
      );
      
      if (matchesFilters) {
        setBookmarks(prev => [newBookmark, ...prev]);
        setTotalCount(prev => prev + 1);
      }
      
      // No need to manually refresh usage stats - the database trigger 'update_bookmark_count_trigger'
      // will automatically increment the bookmark_count in the usage_stats table
      
      toast.success('Bookmark created successfully');
      return newBookmark;
    } catch (err) {
      console.error('Error creating bookmark:', err);
      
      // Check if the error is from the database trigger 'check_bookmark_limit'
      if (err instanceof Error && err.message.includes('Free tier users are limited to 30 bookmarks')) {
        toast.error('Free tier users are limited to 30 bookmarks. Upgrade to Premium for unlimited bookmarks.');
      } else {
        toast.error('Failed to create bookmark');
      }
      
      throw err;
    }
  }, [user, filters]);

  // Update a bookmark
  const handleUpdateBookmark = useCallback(async (id: string, updates: Partial<Bookmark>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updatedBookmark = await updateBookmark(user.id, id, updates);
      
      // Update local state
      setBookmarks(prev => prev.map(bookmark => 
        bookmark.id === id ? { ...bookmark, ...updates } : bookmark
      ));
      
      toast.success('Bookmark updated successfully');
      return updatedBookmark;
    } catch (err) {
      console.error('Error updating bookmark:', err);
      toast.error('Failed to update bookmark');
      throw err;
    }
  }, [user]);

  // Delete a bookmark
  const handleDeleteBookmark = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');
  
    try {
      await deleteBookmark(user.id, id);
      
      // Update local state
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
      setTotalCount(prev => prev - 1);
      
      // No need to manually refresh usage stats - the database trigger 'update_bookmark_count_trigger'
      // will automatically decrement the bookmark_count in the usage_stats table
      
      toast.success('Bookmark deleted successfully');
    } catch (err) {
      console.error('Error deleting bookmark:', err);
      toast.error('Failed to delete bookmark');
      throw err;
    }
  }, [user]);

  return {
    bookmarks,
    isLoading,
    error,
    filters,
    updateFilters,
    totalCount,
    hasMore,
    loadMore,
    refreshBookmarks: fetchBookmarks,
    createBookmark: handleCreateBookmark,
    updateBookmark: handleUpdateBookmark,
    deleteBookmark: handleDeleteBookmark,
  };
};