// src/lib/stores/useFoldersStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getFolders, createFolder, updateFolder, deleteFolder, buildFolderTree } from '../api/folders';
import { Folder, FolderWithCount } from '../supabase/database.types';
import { toast } from 'react-hot-toast';
import { withTimeout } from '../utils/promises';

interface FoldersState {
  folders: FolderWithCount[];
  folderTree: FolderWithCount[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  lastFetchTime: number;
  
  // Actions
  fetchFolders: (userId: string, force?: boolean) => Promise<void>;
  createFolder: (userId: string, name: string, parentId: string | null) => Promise<Folder>;
  renameFolder: (userId: string, folderId: string, name: string) => Promise<Folder>;
  moveFolder: (userId: string, folderId: string, newParentId: string | null) => Promise<Folder>;
  deleteFolder: (userId: string, folderId: string) => Promise<void>;
}

export const useFoldersStore = create<FoldersState>()(
  // Optional persistence middleware
  persist(
    (set, get) => ({
      folders: [],
      folderTree: [],
      isLoading: true,
      isFetching: false,
      error: null,
      lastFetchTime: 0,
      
      fetchFolders: async (userId: string, force = false) => {
        // Skip if no user ID
        if (!userId) {
          set({ 
            folders: [], 
            folderTree: [], 
            isLoading: false, 
            isFetching: false 
          });
          return;
        }
        
        // Throttle requests unless forced
        const { isFetching, lastFetchTime, isLoading } = get();
        const now = Date.now();
        if (!force && !isLoading && now - lastFetchTime < 2000) {
          return;
        }
        
        // Skip if already fetching
        if (isFetching) return;
        
        set({ isFetching: true });
        if (isLoading) {
          set({ isLoading: true });
        }
        
        try {
          const data = await withTimeout(getFolders(userId), 10000);
          set({ 
            folders: data, 
            folderTree: buildFolderTree(data),
            lastFetchTime: Date.now(),
            error: null
          });
        } catch (err) {
          console.error('Error fetching folders:', err);
          set({ 
            error: err instanceof Error ? err : new Error('Failed to fetch folders') 
          });
          
          if (get().isLoading) {
            toast.error('Failed to load folders');
          }
        } finally {
          set({ isFetching: false, isLoading: false });
        }
      },
      
      createFolder: async (userId: string, name: string, parentId = null) => {
        const tempId = `temp-${Date.now()}`;
        const { folders } = get();
        
        // Optimistic update
        const optimisticFolder: FolderWithCount = {
          id: tempId,
          name,
          parent_id: parentId,
          user_id: userId,
          created_at: new Date().toISOString(),
          bookmarkCount: 0,
        };
        
        const updatedFolders = [...folders, optimisticFolder];
        set({ 
          folders: updatedFolders,
          folderTree: buildFolderTree(updatedFolders)
        });
        
        try {
          const newFolder = await withTimeout(createFolder(userId, name, parentId), 10000);
          
          // Replace optimistic folder with real one
          const updatedWithRealFolder = folders.map(folder => 
            folder.id === tempId ? { ...newFolder, bookmarkCount: 0 } : folder
          );
          
          set({ 
            folders: updatedWithRealFolder,
            folderTree: buildFolderTree(updatedWithRealFolder)
          });
          
          toast.success('Folder created successfully');
          return newFolder;
        } catch (err) {
          console.error('Error creating folder:', err);
          
          // Remove optimistic folder on error
          set({ 
            folders: folders,
            folderTree: buildFolderTree(folders)
          });
          
          if (err instanceof Error && err.message.includes('Free tier users are limited to 5 folders')) {
            toast.error('Free tier users are limited to 5 folders. Upgrade to Premium for unlimited folders.');
          } else {
            toast.error('Failed to create folder');
          }
          
          throw err;
        }
      },
      
      renameFolder: async (userId: string, folderId: string, name: string) => {
        const { folders } = get();
        const originalFolder = folders.find(f => f.id === folderId);
        
        if (!originalFolder) {
          throw new Error('Folder not found');
        }
        
        // Optimistic update
        const updatedFolders = folders.map(folder => 
          folder.id === folderId ? { ...folder, name } : folder
        );
        
        set({ 
          folders: updatedFolders,
          folderTree: buildFolderTree(updatedFolders)
        });
        
        try {
          const updatedFolder = await withTimeout(updateFolder(userId, folderId, { name }), 10000);
          toast.success('Folder renamed successfully');
          return updatedFolder;
        } catch (err) {
          console.error('Error renaming folder:', err);
          
          // Rollback on error
          set({ 
            folders: folders,
            folderTree: buildFolderTree(folders)
          });
          
          toast.error('Failed to rename folder');
          throw err;
        }
      },
      
      moveFolder: async (userId: string, folderId: string, newParentId: string | null) => {
        const { folders } = get();
        
        if (newParentId === folderId) {
          toast.error('A folder cannot be its own parent');
          throw new Error('Circular reference detected');
        }
        
        // Check for circular references
        const isDescendant = (parentId: string | null, childId: string): boolean => {
          if (!parentId) return false;
          const folder = folders.find(f => f.id === parentId);
          if (!folder) return false;
          if (folder.parent_id === childId) return true;
          return folder.parent_id ? isDescendant(folder.parent_id, childId) : false;
        };
        
        if (newParentId && isDescendant(newParentId, folderId)) {
          toast.error('Cannot move a folder into its own subfolder');
          throw new Error('Circular reference detected');
        }
        
        const originalFolder = folders.find(f => f.id === folderId);
        if (!originalFolder) {
          throw new Error('Folder not found');
        }
        
        // Optimistic update
        const updatedFolders = folders.map(folder => 
          folder.id === folderId ? { ...folder, parent_id: newParentId } : folder
        );
        
        set({ 
          folders: updatedFolders,
          folderTree: buildFolderTree(updatedFolders)
        });
        
        try {
          const updatedFolder = await withTimeout(
            updateFolder(userId, folderId, { parent_id: newParentId }), 
            10000
          );
          toast.success('Folder moved successfully');
          return updatedFolder;
        } catch (err) {
          console.error('Error moving folder:', err);
          
          // Rollback on error
          set({ 
            folders: folders,
            folderTree: buildFolderTree(folders)
          });
          
          toast.error('Failed to move folder');
          throw err;
        }
      },
      
      deleteFolder: async (userId: string, folderId: string) => {
        const { folders } = get();
        const deletedFolder = folders.find(f => f.id === folderId);
        // const deletedChildren = folders.filter(f => f.parent_id === folderId);
        const remainingFolders = folders.filter(folder => 
          folder.id !== folderId && folder.parent_id !== folderId
        );
        
        // Optimistic update
        set({ 
          folders: remainingFolders,
          folderTree: buildFolderTree(remainingFolders)
        });
        
        try {
          await withTimeout(deleteFolder(userId, folderId), 10000);
          toast.success('Folder deleted successfully');
        } catch (err) {
          console.error('Error deleting folder:', err);
          
          // Rollback on error
          if (deletedFolder) {
            set({ 
              folders: folders,
              folderTree: buildFolderTree(folders)
            });
          }
          
          toast.error('Failed to delete folder');
          throw err;
        }
      },
    }),
    {
      name: 'folders-storage', // unique name for localStorage
      partialize: (state) => ({ folders: state.folders }), // only persist folders array
    }
  )
);