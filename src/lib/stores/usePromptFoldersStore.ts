// src/lib/stores/usePromptFoldersStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  getPromptFolders, 
  createPromptFolder, 
  updatePromptFolder, 
  deletePromptFolder, 
  buildPromptFolderTree 
} from '../api/promptFolders';
import { PromptFolder, PromptFolderWithCount } from '../supabase/database.types';
import { toast } from 'react-hot-toast';
import { withTimeout } from '../utils/promises';

interface PromptFoldersState {
  folders: PromptFolderWithCount[];
  folderTree: PromptFolderWithCount[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  lastFetchTime: number;
  
  // Actions
  fetchFolders: (userId: string, force?: boolean) => Promise<void>;
  createFolder: (userId: string, name: string, parentId: string | null) => Promise<PromptFolder>;
  renameFolder: (userId: string, folderId: string, name: string) => Promise<PromptFolder>;
  moveFolder: (userId: string, folderId: string, newParentId: string | null) => Promise<PromptFolder>;
  deleteFolder: (userId: string, folderId: string) => Promise<void>;
}

export const usePromptFoldersStore = create<PromptFoldersState>()(
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
          const data = await withTimeout(getPromptFolders(userId), 10000);
          set({ 
            folders: data, 
            folderTree: buildPromptFolderTree(data),
            lastFetchTime: Date.now(),
            error: null
          });
        } catch (err) {
          console.error('Error fetching prompt folders:', err);
          set({ 
            error: err instanceof Error ? err : new Error('Failed to fetch prompt folders') 
          });
          
          if (get().isLoading) {
            toast.error('Failed to load prompt folders');
          }
        } finally {
          set({ isFetching: false, isLoading: false });
        }
      },
      
      createFolder: async (userId: string, name: string, parentId = null) => {
        const tempId = `temp-${Date.now()}`;
        const { folders } = get();
        
        // Optimistic update
        const optimisticFolder: PromptFolderWithCount = {
          id: tempId,
          name,
          parent_id: parentId,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          promptCount: 0,
        };
        
        const updatedFolders = [...folders, optimisticFolder];
        set({ 
          folders: updatedFolders,
          folderTree: buildPromptFolderTree(updatedFolders),
          lastFetchTime: Date.now()
        });
        
        try {
          const newFolder = await withTimeout(createPromptFolder(userId, name, parentId), 10000);
          
          const currentFolders = get().folders;
          // Replace optimistic folder with real one
          const updatedWithRealFolder = currentFolders.map(folder => 
            folder.id === tempId ? { ...newFolder, promptCount: 0 } : folder
          );
          
          set({ 
            folders: updatedWithRealFolder,
            folderTree: buildPromptFolderTree(updatedWithRealFolder),
            lastFetchTime: Date.now()
          });
          
          toast.success('Prompt folder created successfully');
          return newFolder;
        } catch (err) {
          console.error('Error creating prompt folder:', err);
          
          // Get the latest state for the rollback
          const currentFolders = get().folders;
          // Remove optimistic folder on error
          set({ 
            folders: currentFolders.filter(f => f.id !== tempId),
            folderTree: buildPromptFolderTree(currentFolders.filter(f => f.id !== tempId)),
            lastFetchTime: Date.now()
          });
          
          toast.error('Failed to create prompt folder');
          throw err;
        }
      },
      
      renameFolder: async (userId: string, folderId: string, name: string) => {
        const { folders } = get();
        const originalFolder = folders.find(f => f.id === folderId);
        
        if (!originalFolder) {
          throw new Error('Prompt folder not found');
        }
        
        // Optimistic update
        const updatedFolders = folders.map(folder => 
          folder.id === folderId ? { ...folder, name } : folder
        );
        
        set({ 
          folders: updatedFolders,
          folderTree: buildPromptFolderTree(updatedFolders)
        });
        
        try {
          const updatedFolder = await withTimeout(updatePromptFolder(userId, folderId, { name }), 10000);
          toast.success('Prompt folder renamed successfully');
          return updatedFolder;
        } catch (err) {
          console.error('Error renaming prompt folder:', err);
          
          // Rollback on error
          set({ 
            folders: folders,
            folderTree: buildPromptFolderTree(folders)
          });
          
          toast.error('Failed to rename prompt folder');
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
          throw new Error('Prompt folder not found');
        }
        
        // Optimistic update
        const updatedFolders = folders.map(folder => 
          folder.id === folderId ? { ...folder, parent_id: newParentId } : folder
        );
        
        set({ 
          folders: updatedFolders,
          folderTree: buildPromptFolderTree(updatedFolders)
        });
        
        try {
          const updatedFolder = await withTimeout(
            updatePromptFolder(userId, folderId, { parent_id: newParentId }), 
            10000
          );
          toast.success('Prompt folder moved successfully');
          return updatedFolder;
        } catch (err) {
          console.error('Error moving prompt folder:', err);
          
          // Rollback on error
          set({ 
            folders: folders,
            folderTree: buildPromptFolderTree(folders)
          });
          
          toast.error('Failed to move prompt folder');
          throw err;
        }
      },
      
      deleteFolder: async (userId: string, folderId: string) => {
        const { folders } = get();
        const deletedFolder = folders.find(f => f.id === folderId);
        const remainingFolders = folders.filter(folder => 
          folder.id !== folderId && folder.parent_id !== folderId
        );
        
        // Optimistic update
        set({ 
          folders: remainingFolders,
          folderTree: buildPromptFolderTree(remainingFolders)
        });
        
        try {
          await withTimeout(deletePromptFolder(userId, folderId), 10000);
          toast.success('Prompt folder deleted successfully');
        } catch (err) {
          console.error('Error deleting prompt folder:', err);
          
          // Rollback on error
          if (deletedFolder) {
            set({ 
              folders: folders,
              folderTree: buildPromptFolderTree(folders)
            });
          }
          
          toast.error('Failed to delete prompt folder');
          throw err;
        }
      },
    }),
    {
      name: 'prompt-folders-storage',
      partialize: (state) => ({ 
        folders: state.folders,
        lastFetchTime: state.lastFetchTime 
      }),
    }
  )
);