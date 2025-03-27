// src/lib/hooks/useFolders.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFolders, createFolder, updateFolder, deleteFolder, buildFolderTree } from '../api/folders';
import { FolderWithCount } from '../supabase/database.types';
import { toast } from 'react-hot-toast';

interface UseFoldersOptions {
  initialData?: FolderWithCount[];
  autoFetch?: boolean;
}

export const useFolders = (options: UseFoldersOptions = {}) => {
  const { 
    initialData = [],
    autoFetch = true
  } = options;
  
  const { user, initialized } = useAuth();
  const [folders, setFolders] = useState<FolderWithCount[]>(initialData);
  const [folderTree, setFolderTree] = useState<FolderWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const firstLoadComplete = useRef(false);

  // Rebuild folder tree when folders change
  useEffect(() => {
    setFolderTree(buildFolderTree(folders));
  }, [folders]);

  // Fetch all folders
  const fetchFolders = useCallback(async () => {
    if (!user) {
      setFolders(initialData);
      setFolderTree(buildFolderTree(initialData));
      setIsLoading(false);
      firstLoadComplete.current = true;
      return;
    }

    if (isFetching) return;

    setIsFetching(true);
    if (!firstLoadComplete.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await getFolders(user.id);
      setFolders(data);
      firstLoadComplete.current = true;
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch folders'));
      
      // Only show toast error if this is the initial load
      if (!firstLoadComplete.current) {
        toast.error('Failed to load folders');
      }
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [user, initialData, isFetching]);

  // Load folders when auth is initialized
  useEffect(() => {
    if (autoFetch && initialized) {
      fetchFolders();
    }
  }, [autoFetch, initialized, fetchFolders]);

  // Create a new folder with optimistic updates
  const handleCreateFolder = useCallback(async (name: string, parentId: string | null = null) => {
    if (!user) throw new Error('User not authenticated');
  
    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    
    // Create optimistic folder
    const optimisticFolder: FolderWithCount = {
      id: tempId,
      name,
      parent_id: parentId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      bookmarkCount: 0,
    };
    
    // Update UI immediately
    setFolders(prev => [...prev, optimisticFolder]);
  
    try {
      // The database has a trigger that checks the folder limit for free tier users
      const newFolder = await createFolder(user.id, name, parentId);
      
      // Replace optimistic folder with real one
      setFolders(prev => prev.map(folder => 
        folder.id === tempId ? {
          ...newFolder,
          bookmarkCount: 0
        } : folder
      ));
      
      toast.success('Folder created successfully');
      return newFolder;
    } catch (err) {
      console.error('Error creating folder:', err);
      
      // Remove optimistic folder on error
      setFolders(prev => prev.filter(folder => folder.id !== tempId));
      
      // Check if the error is from the database trigger 'check_folder_limit'
      if (err instanceof Error && err.message.includes('Free tier users are limited to 5 folders')) {
        toast.error('Free tier users are limited to 5 folders. Upgrade to Premium for unlimited folders.');
      } else {
        toast.error('Failed to create folder');
      }
      
      throw err;
    }
  }, [user]);

  // Rename a folder with optimistic update
  const handleRenameFolder = useCallback(async (folderId: string, name: string) => {
    if (!user) throw new Error('User not authenticated');

    // Store original folder for rollback
    const originalFolder = folders.find(f => f.id === folderId);
    if (!originalFolder) {
      throw new Error('Folder not found');
    }

    // Apply optimistic update
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, name } : folder
    ));

    try {
      const updatedFolder = await updateFolder(user.id, folderId, { name });
      toast.success('Folder renamed successfully');
      return updatedFolder;
    } catch (err) {
      console.error('Error renaming folder:', err);
      
      // Rollback on error
      if (originalFolder) {
        setFolders(prev => prev.map(folder => 
          folder.id === folderId ? originalFolder : folder
        ));
      }
      
      toast.error('Failed to rename folder');
      throw err;
    }
  }, [user, folders]);

  // Move a folder with validations and optimistic update
  const handleMoveFolder = useCallback(async (folderId: string, newParentId: string | null) => {
    if (!user) throw new Error('User not authenticated');

    // Prevent circular references
    if (newParentId === folderId) {
      toast.error('A folder cannot be its own parent');
      throw new Error('Circular reference detected');
    }

    // Check if newParentId is a descendant of folderId (would create a loop)
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
    
    // Store original folder for rollback
    const originalFolder = folders.find(f => f.id === folderId);
    if (!originalFolder) {
      throw new Error('Folder not found');
    }

    // Apply optimistic update
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, parent_id: newParentId } : folder
    ));

    try {
      const updatedFolder = await updateFolder(user.id, folderId, { parent_id: newParentId });
      toast.success('Folder moved successfully');
      return updatedFolder;
    } catch (err) {
      console.error('Error moving folder:', err);
      
      // Rollback on error
      if (originalFolder) {
        setFolders(prev => prev.map(folder => 
          folder.id === folderId ? originalFolder : folder
        ));
      }
      
      toast.error('Failed to move folder');
      throw err;
    }
  }, [user, folders]);

  // Delete a folder with optimistic update
  const handleDeleteFolder = useCallback(async (folderId: string) => {
    if (!user) throw new Error('User not authenticated');
  
    // Store deleted folder and its children for potential rollback
    const deletedFolder = folders.find(f => f.id === folderId);
    const deletedChildren = folders.filter(f => f.parent_id === folderId);
    const allDeleted = deletedFolder ? [deletedFolder, ...deletedChildren] : [];
    
    // Optimistic delete
    setFolders(prev => prev.filter(folder => 
      folder.id !== folderId && folder.parent_id !== folderId
    ));
  
    try {
      await deleteFolder(user.id, folderId);
      toast.success('Folder deleted successfully');
    } catch (err) {
      console.error('Error deleting folder:', err);
      
      // Rollback on error
      if (allDeleted.length > 0) {
        setFolders(prev => [...prev, ...allDeleted]);
      }
      
      toast.error('Failed to delete folder');
      throw err;
    }
  }, [user, folders]);

  return {
    folders,
    folderTree,
    isLoading,
    isFetching,
    error,
    refreshFolders: fetchFolders,
    createFolder: handleCreateFolder,
    renameFolder: handleRenameFolder,
    moveFolder: handleMoveFolder,
    deleteFolder: handleDeleteFolder,
  };
};