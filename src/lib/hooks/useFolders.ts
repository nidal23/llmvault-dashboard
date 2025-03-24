//Folder-related hooks

// src/lib/hooks/useFolders.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFolders, createFolder, updateFolder, deleteFolder, buildFolderTree } from '../api/folders';
import { FolderWithCount } from '../supabase/database.types';
import { toast } from 'react-hot-toast';

export const useFolders = () => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderWithCount[]>([]);
  const [folderTree, setFolderTree] = useState<FolderWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all folders
  const fetchFolders = useCallback(async () => {
    if (!user) {
      setFolders([]);
      setFolderTree([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getFolders(user.id);
      setFolders(data);
      setFolderTree(buildFolderTree(data));
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch folders'));
      toast.error('Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load folders on component mount
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Create a new folder
  const handleCreateFolder = useCallback(async (name: string, parentId: string | null = null) => {
    if (!user) throw new Error('User not authenticated');
  
    try {
      // The database has a trigger that checks the folder limit for free tier users
      // It will throw an error if the limit is reached
      const newFolder = await createFolder(user.id, name, parentId);
      
      // Update local state
      setFolders(prev => [...prev, {
        ...newFolder,
        bookmarkCount: 0
      }]);
      
      // Refresh the folder tree
      fetchFolders();
      
      // No need to manually refresh usage stats - the database trigger 'update_folder_count_trigger'
      // will automatically increment the folder_count in the usage_stats table
      
      toast.success('Folder created successfully');
      return newFolder;
    } catch (err) {
      console.error('Error creating folder:', err);
      
      // Check if the error is from the database trigger 'check_folder_limit'
      if (err instanceof Error && err.message.includes('Free tier users are limited to 5 folders')) {
        toast.error('Free tier users are limited to 5 folders. Upgrade to Premium for unlimited folders.');
      } else {
        toast.error('Failed to create folder');
      }
      
      throw err;
    }
  }, [user, fetchFolders]);

  // Rename a folder
  const handleRenameFolder = useCallback(async (folderId: string, name: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updatedFolder = await updateFolder(user.id, folderId, { name });
      
      // Update local state
      setFolders(prev => prev.map(folder => 
        folder.id === folderId ? { ...folder, name } : folder
      ));
      
      toast.success('Folder renamed successfully');
      return updatedFolder;
    } catch (err) {
      console.error('Error renaming folder:', err);
      toast.error('Failed to rename folder');
      throw err;
    }
  }, [user]);

  // Move a folder
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

    try {
      const updatedFolder = await updateFolder(user.id, folderId, { parent_id: newParentId });
      
      // Update local state
      setFolders(prev => prev.map(folder => 
        folder.id === folderId ? { ...folder, parent_id: newParentId } : folder
      ));
      
      // Refresh the folder tree to update hierarchy
      setFolderTree(buildFolderTree(folders.map(folder => 
        folder.id === folderId ? { ...folder, parent_id: newParentId } : folder
      )));
      
      toast.success('Folder moved successfully');
      return updatedFolder;
    } catch (err) {
      console.error('Error moving folder:', err);
      toast.error('Failed to move folder');
      throw err;
    }
  }, [user, folders]);

  // Delete a folder
  const handleDeleteFolder = useCallback(async (folderId: string) => {
    if (!user) throw new Error('User not authenticated');
  
    try {
      await deleteFolder(user.id, folderId);
      
      // Update local state
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      
      // Refresh the folder tree
      fetchFolders();
      
      // No need to manually refresh usage stats - the database trigger 'update_folder_count_trigger'
      // will automatically decrement the folder_count in the usage_stats table
      
      toast.success('Folder deleted successfully');
    } catch (err) {
      console.error('Error deleting folder:', err);
      toast.error('Failed to delete folder');
      throw err;
    }
  }, [user, fetchFolders]);

  return {
    folders,
    folderTree,
    isLoading,
    error,
    refreshFolders: fetchFolders,
    createFolder: handleCreateFolder,
    renameFolder: handleRenameFolder,
    moveFolder: handleMoveFolder,
    deleteFolder: handleDeleteFolder,
  };
};