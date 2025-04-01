// src/lib/hooks/useBookmarks.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getBookmarks, createBookmark, updateBookmark, deleteBookmark } from '../api/bookmarks';
import { Bookmark, BookmarkWithFolder } from '../supabase/database.types';
import { toast } from 'react-hot-toast';

interface BookmarkFilters {
  folderId?: string;
  search?: string;
  platform?: string;
  label?: string;
}

interface UseBookmarksOptions {
  limit?: number;
  initialData?: BookmarkWithFolder[];
  cacheKey?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  autoFetch?: boolean;
}

export const useBookmarks = (initialFilters: BookmarkFilters = {}, options: UseBookmarksOptions = {}) => {
  const { 
    limit = 30, 
    initialData = [],
    autoFetch = true 
  } = options;
  
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkWithFolder[]>(initialData);
  const [filters, setFilters] = useState<BookmarkFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const firstLoadComplete = useRef(false);

  // Fetch bookmarks based on filters
  const fetchBookmarks = useCallback(async (resetPagination = true) => {
    if (!user) {
      setBookmarks(initialData);
      setIsLoading(false);
      firstLoadComplete.current = true;
      return;
    }

    if (isFetching) return;

    const currentPage = resetPagination ? 1 : page;
    
    if (resetPagination) {
      setPage(1);
      if (!firstLoadComplete.current) {
        setBookmarks(initialData);
      }
    }

    setIsFetching(true);
    if (!firstLoadComplete.current) {
      setIsLoading(true); 
    }
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
      
      firstLoadComplete.current = true;
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch bookmarks'));
      
      // Only show toast error if this is the initial load
      if (!firstLoadComplete.current) {
        toast.error('Failed to load bookmarks');
      }
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [user, filters, page, limit, initialData, isFetching]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<BookmarkFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Load next page
  const loadMore = useCallback(() => {
    if (!isLoading && !isFetching && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, isFetching, hasMore]);

  // Load bookmarks when filters change
  useEffect(() => {
    if (autoFetch && user) {
      fetchBookmarks(true);
    }
  }, [filters, user, autoFetch, fetchBookmarks]);

  // Load more bookmarks when page changes
  useEffect(() => {
    if (page > 1 && user) {
      fetchBookmarks(false);
    }
  }, [page, user, fetchBookmarks]);

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
  
    // Generate a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    
    // Create optimistic bookmark
    const optimisticBookmark: BookmarkWithFolder = {
      id: tempId,
      user_id: user.id,
      folder_id: data.folder_id,
      url: data.url,
      title: data.title,
      label: data.label || null, // Ensure label is string | null, not undefined
      platform: data.platform || null, // Ensure platform is string | null, not undefined 
      notes: data.notes || null, // Ensure notes is string | null, not undefined
      created_at: new Date().toISOString(),
      folder_name: undefined // TypeScript should still allow this if folder_name is optional
    };
    
    // Update UI immediately for better responsiveness
    const matchesFilters = (
      (!filters.folderId || data.folder_id === filters.folderId) &&
      (!filters.platform || data.platform === filters.platform) &&
      (!filters.label || data.label === filters.label)
    );
    
    if (matchesFilters) {
      setBookmarks(prev => [optimisticBookmark, ...prev]);
      setTotalCount(prev => prev + 1);
    }
  
    try {
      // The database has a trigger that checks the bookmark limit for free tier users
      const newBookmark = await createBookmark(user.id, data);
      
      // Replace optimistic bookmark with real one
      if (matchesFilters) {
        setBookmarks(prev => prev.map(bookmark => 
          bookmark.id === tempId ? newBookmark : bookmark
        ));
      }
      
      toast.success('Bookmark created successfully');
      return newBookmark;
    } catch (err) {
      console.error('Error creating bookmark:', err);
      
      // Remove optimistic bookmark on error
      if (matchesFilters) {
        setBookmarks(prev => prev.filter(bookmark => bookmark.id !== tempId));
        setTotalCount(prev => prev - 1);
      }
      
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

    // Store original bookmark for rollback
    const originalBookmark = bookmarks.find(b => b.id === id);
    if (!originalBookmark) {
      throw new Error('Bookmark not found');
    }

    // Apply optimistic update
    setBookmarks(prev => prev.map(bookmark => 
      bookmark.id === id ? { ...bookmark, ...updates } : bookmark
    ));

    try {
      const updatedBookmark = await updateBookmark(user.id, id, updates);
      toast.success('Bookmark updated successfully');
      return updatedBookmark;
    } catch (err) {
      console.error('Error updating bookmark:', err);
      
      // Rollback on error
      if (originalBookmark) {
        setBookmarks(prev => prev.map(bookmark => 
          bookmark.id === id ? originalBookmark : bookmark
        ));
      }
      
      toast.error('Failed to update bookmark');
      throw err;
    }
  }, [user, bookmarks]);

  // Delete a bookmark
  const handleDeleteBookmark = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');
  
    // Store deleted bookmark for potential rollback
    const deletedBookmark = bookmarks.find(b => b.id === id);
    
    // Optimistic delete
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
    setTotalCount(prev => prev - 1);
  
    try {
      await deleteBookmark(user.id, id);
      toast.success('Bookmark deleted successfully');
    } catch (err) {
      console.error('Error deleting bookmark:', err);
      
      // Rollback on error
      if (deletedBookmark) {
        setBookmarks(prev => [...prev, deletedBookmark]);
        setTotalCount(prev => prev + 1);
      }
      
      toast.error('Failed to delete bookmark');
      throw err;
    }
  }, [user, bookmarks]);

  return {
    bookmarks,
    isLoading,
    isFetching,
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