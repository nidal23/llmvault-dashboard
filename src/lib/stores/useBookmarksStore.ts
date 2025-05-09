// src/lib/stores/useBookmarksStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  getBookmarks, 
  createBookmark, 
  updateBookmark, 
  deleteBookmark, 
  getBookmarkStats 
} from '../api/bookmarks';
import { BookmarkWithFolder, Bookmark } from '../supabase/database.types';
import { toast } from 'react-hot-toast';
import { withTimeout } from '../utils/promises';

interface BookmarkFilters {
  folderId?: string;
  search?: string;
  platform?: string;
  label?: string;
  page?: number;
  limit?: number;
}

interface BookmarkStats {
  totalCount: number;
  byPlatform: Record<string, number>;
  byLabel: Record<string, number>;
  recentCount: number;
  folderCount?: number;
}

interface BookmarksState {
  // Data
  bookmarks: BookmarkWithFolder[];
  stats: BookmarkStats | null;
  
  // UI state
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  filters: BookmarkFilters;
  totalCount: number;
  page: number;
  hasMore: boolean;
  lastFetchTime: number;
  
  // Actions
  fetchBookmarks: (userId: string, filters?: BookmarkFilters, resetPagination?: boolean) => Promise<void>;
  fetchBookmarkStats: (userId: string) => Promise<void>;
  updateFilters: (newFilters: Partial<BookmarkFilters>) => void;
  loadMore: () => void;
  createBookmark: (userId: string, data: {
    folder_id: string;
    url: string;
    title: string;
    label?: string | null;
    platform?: string | null;
    notes?: string | null;
  }) => Promise<Bookmark>;
  updateBookmark: (userId: string, bookmarkId: string, updates: Partial<Bookmark>) => Promise<Bookmark>;
  deleteBookmark: (userId: string, bookmarkId: string) => Promise<void>;
}

export const useBookmarksStore = create<BookmarksState>()(
  // Optional persistence middleware - only persisting filters
  persist(
    (set, get) => ({
      // Initial state
      bookmarks: [],
      stats: null,
      isLoading: false,
      isFetching: false,
      error: null,
      filters: { limit: 30 },
      totalCount: 0,
      page: 1,
      hasMore: true,
      lastFetchTime: 0,
      
      // Actions
      fetchBookmarks: async (userId: string, customFilters?: BookmarkFilters, resetPagination = true) => {
        // Skip if no user ID
        if (!userId) {
          set({ 
            bookmarks: [],
            isLoading: false,
            isFetching: false
          });
          return;
        }
        
        const { isFetching, filters: currentFilters, page } = get();
        
        // Skip if already fetching
        if (isFetching) return;
        
        // Determine which filters to use
        const filtersToUse = customFilters || currentFilters;
        const currentPage = resetPagination ? 1 : page;
        
        set({ 
          isFetching: true,
          isLoading: !get().bookmarks.length,
          error: null
        });
        
        if (resetPagination) {
          set({ page: 1 });
        }
        
        try {
          const data = await withTimeout(getBookmarks(userId, {
            ...filtersToUse,
            page: currentPage,
            // limit: filtersToUse.limit || 30
          }), 10000);
          
          if (resetPagination) {
            set({ bookmarks: data });
          } else {
            set(state => ({ 
              bookmarks: [...state.bookmarks, ...data] 
            }));
          }
          
          // Update pagination state
          const limit = filtersToUse.limit || 30;
          set({
            hasMore: data.length === limit,
            page: currentPage,
            totalCount: resetPagination ? 
              (data.length < limit ? data.length : data.length * 2) : 
              get().totalCount,
            lastFetchTime: Date.now()
          });
          
        } catch (err) {
          console.error('Error fetching bookmarks:', err);
          set({ 
            error: err instanceof Error ? err : new Error('Failed to fetch bookmarks')
          });
          
          if (get().isLoading) {
            toast.error('Failed to load bookmarks');
          }
        } finally {
          set({ 
            isFetching: false, 
            isLoading: false 
          });
        }
      },
      
      fetchBookmarkStats: async (userId: string) => {
        if (!userId) return;
        
        try {
          const stats = await withTimeout(getBookmarkStats(userId), 10000);
          set({ stats });
        } catch (err) {
          console.error('Error fetching bookmark stats:', err);
          toast.error('Failed to load bookmark statistics');
        }
      },
      
      updateFilters: (newFilters: Partial<BookmarkFilters>) => {
        set(state => ({ 
          filters: { ...state.filters, ...newFilters } 
        }));
      },
      
      loadMore: () => {
        const { isLoading, isFetching, hasMore } = get();
        if (!isLoading && !isFetching && hasMore) {
          set(state => ({ page: state.page + 1 }));
        }
      },
      
      createBookmark: async (userId: string, data) => {
        const tempId = `temp-${Date.now()}`;
        const { bookmarks, filters } = get();
        
        // Create optimistic bookmark
        const optimisticBookmark: BookmarkWithFolder = {
          id: tempId,
          user_id: userId,
          folder_id: data.folder_id,
          url: data.url,
          title: data.title,
          label: data.label || null,
          platform: data.platform || null,
          notes: data.notes || null,
          created_at: new Date().toISOString(),
          folder_name: undefined // TypeScript should still allow this
        };
        
        // Check if bookmark matches current filters
        const matchesFilters = (
          (!filters.folderId || data.folder_id === filters.folderId) &&
          (!filters.platform || data.platform === filters.platform) &&
          (!filters.label || data.label === filters.label)
        );
        
        // Update UI optimistically
        if (matchesFilters) {
          set({ 
            bookmarks: [optimisticBookmark, ...bookmarks],
            totalCount: get().totalCount + 1
          });
        }
        
        try {
          const newBookmark = await withTimeout(createBookmark(userId, data), 10000);
          
          // Replace optimistic bookmark with real one
          if (matchesFilters) {
            set(state => ({
              bookmarks: state.bookmarks.map(bookmark => 
                bookmark.id === tempId ? 
                  // Add the folder_name property to the new bookmark
                  { ...newBookmark, folder_name: undefined } : 
                  bookmark
              )
            }));
          }
          
          toast.success('Bookmark created successfully');
          return newBookmark;
        } catch (err) {
          console.error('Error creating bookmark:', err);
          
          // Remove optimistic bookmark on error
          if (matchesFilters) {
            set(state => ({
              bookmarks: state.bookmarks.filter(bookmark => bookmark.id !== tempId),
              totalCount: state.totalCount - 1
            }));
          }
          
          if (err instanceof Error && err.message.includes('Free tier users are limited to 30 bookmarks')) {
            toast.error('Free tier users are limited to 30 bookmarks. Upgrade to Premium for unlimited bookmarks.');
          } else {
            toast.error('Failed to create bookmark');
          }
          
          throw err;
        }
      },
      
      updateBookmark: async (userId: string, bookmarkId: string, updates) => {
        const { bookmarks } = get();
        
        // Find original bookmark for rollback
        const originalBookmark = bookmarks.find(b => b.id === bookmarkId);
        if (!originalBookmark) {
          throw new Error('Bookmark not found');
        }
        
        // Apply optimistic update
        set(state => ({
          bookmarks: state.bookmarks.map(bookmark => 
            bookmark.id === bookmarkId ? { ...bookmark, ...updates } : bookmark
          )
        }));
        
        try {
          const updatedBookmark = await withTimeout(
            updateBookmark(userId, bookmarkId, updates),
            10000
          );
          
          toast.success('Bookmark updated successfully');
          return updatedBookmark;
        } catch (err) {
          console.error('Error updating bookmark:', err);
          
          // Rollback on error
          set(state => ({
            bookmarks: state.bookmarks.map(bookmark => 
              bookmark.id === bookmarkId ? originalBookmark : bookmark
            )
          }));
          
          toast.error('Failed to update bookmark');
          throw err;
        }
      },
      
      deleteBookmark: async (userId: string, bookmarkId: string) => {
        const { bookmarks } = get();
        
        // Store deleted bookmark for potential rollback
        const deletedBookmark = bookmarks.find(b => b.id === bookmarkId);
        
        // Optimistic delete
        set(state => ({
          bookmarks: state.bookmarks.filter(bookmark => bookmark.id !== bookmarkId),
          totalCount: state.totalCount - 1
        }));
        
        try {
          await withTimeout(deleteBookmark(userId, bookmarkId), 10000);
          toast.success('Bookmark deleted successfully');
        } catch (err) {
          console.error('Error deleting bookmark:', err);
          
          // Rollback on error
          if (deletedBookmark) {
            set(state => ({
              bookmarks: [...state.bookmarks, deletedBookmark],
              totalCount: state.totalCount + 1
            }));
          }
          
          toast.error('Failed to delete bookmark');
          throw err;
        }
      }
    }),
    {
      name: 'bookmarks-storage',
      partialize: (state) => ({ 
        filters: state.filters
      }),
    }
  )
);