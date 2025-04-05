import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { FolderWithCount } from "@/lib/supabase/database.types";
import { useFoldersStore } from '@/lib/stores/useFoldersStore';
import { useAuth } from "@/lib/hooks/useAuth";

// Import sub-components
import FolderItem from './FolderItem';
import { FolderDialogs } from './FolderDialogs';

interface FolderTreeProps {
  folders: FolderWithCount[];
  selectedFolder?: string;
  onFolderSelect: (folderId: string) => void;
}

const FolderTree = ({ folders, selectedFolder, onFolderSelect }: FolderTreeProps) => {
  const { 
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    isFetching
  } = useFoldersStore();

  const { user } = useAuth();
  
  // State management
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [editFolderDialogOpen, setEditFolderDialogOpen] = useState(false);
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Drag and drop state
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const rootDropRef = useRef<HTMLDivElement>(null);

  // State updater functions to avoid re-renders
  const updateFolderName = useCallback((name: string) => {
    setFolderName(name);
  }, []);
  
  const updateParentFolderId = useCallback((id: string | null) => {
    setParentFolderId(id);
  }, []);
  
  // Auto-expand the selected folder's parents when selected folder changes
  useEffect(() => {
    if (selectedFolder) {
      // Find all parent folders of the selected folder
      const parentFolders: string[] = [];
      let currentFolder = folders.find(f => f.id === selectedFolder);
      
      while (currentFolder?.parent_id) {
        parentFolders.push(currentFolder.parent_id);
        currentFolder = folders.find(f => f.id === currentFolder?.parent_id);
      }
      
      // Expand all parent folders and the selected folder itself
      if (parentFolders.length > 0 || selectedFolder) {
        setExpandedFolders(prev => {
          const newExpanded = [...prev];
          parentFolders.forEach(id => {
            if (!newExpanded.includes(id)) {
              newExpanded.push(id);
            }
          });
          
          // Also expand the selected folder to show its children
          if (selectedFolder && !newExpanded.includes(selectedFolder)) {
            newExpanded.push(selectedFolder);
          }
          
          return newExpanded;
        });
      }
    }
  }, [selectedFolder, folders]);
  
  /**
   * Folder visibility and structure logic
   */
  
  // Function to get the selected folder's ancestry chain (including self)
  const getSelectedFolderWithAncestry = useCallback((): string[] => {
    if (!selectedFolder) return [];
    
    const ancestry: string[] = [selectedFolder];
    let currentFolder = folders.find(f => f.id === selectedFolder);
    
    while (currentFolder?.parent_id) {
      ancestry.push(currentFolder.parent_id);
      currentFolder = folders.find(f => f.id === currentFolder?.parent_id);
    }
    
    return ancestry;
  }, [folders, selectedFolder]);
  
  // Function to recursively get all descendants of a folder
  const getAllDescendants = useCallback((folderId: string): string[] => {
    const directChildren = folders
      .filter(folder => folder.parent_id === folderId)
      .map(folder => folder.id);
      
    if (directChildren.length === 0) return [];
    
    const allDescendants = [...directChildren];
    
    // Recursively get descendants of each child
    directChildren.forEach(childId => {
      const childDescendants = getAllDescendants(childId);
      allDescendants.push(...childDescendants);
    });
    
    return allDescendants;
  }, [folders]);
  
  // Get all folders visible in the current tree view
  const getVisibleFolders = useCallback((): FolderWithCount[] => {
    if (!selectedFolder) return folders;
    
    const ancestry = getSelectedFolderWithAncestry();
    const descendants = getAllDescendants(selectedFolder);
    const relevantFolderIds = [...ancestry, ...descendants];
    
    return folders.filter(folder => relevantFolderIds.includes(folder.id));
  }, [folders, selectedFolder, getSelectedFolderWithAncestry, getAllDescendants]);
  
  // Determine if a folder should be shown in the tree when a specific folder is selected
  const shouldShowFolderInSelectedView = useCallback((folderId: string): boolean => {
    if (!selectedFolder) return true; // Show all in "All Bookmarks" view
    
    const ancestry = getSelectedFolderWithAncestry();
    
    // If this folder is the selected folder or in its ancestry chain, show it
    if (ancestry.includes(folderId)) return true;
    
    // If this folder is a descendant of the selected folder, show it
    const allDescendants = getAllDescendants(selectedFolder);
    if (allDescendants.includes(folderId)) return true;
    
    // Show siblings of the selected folder
    const selectedFolderData = folders.find(f => f.id === selectedFolder);
    if (selectedFolderData && selectedFolderData.parent_id) {
      const folderData = folders.find(f => f.id === folderId);
      // If the folder has the same parent as the selected folder, it's a sibling
      if (folderData && folderData.parent_id === selectedFolderData.parent_id) {
        return true;
      }
    }
    
    return false;
  }, [selectedFolder, getSelectedFolderWithAncestry, getAllDescendants, folders]);
  
  // Determine if a folder can have visible children
  const canHaveVisibleChildren = useCallback((folderId: string): boolean => {
    if (!selectedFolder) return true; // In "All Bookmarks" view, all folders can show children
    
    // In selected folder view, only the selected folder, its ancestors, and siblings can show their children
    const ancestry = getSelectedFolderWithAncestry();
    if (folderId === selectedFolder || ancestry.includes(folderId)) return true;
    
    // Allow siblings to show their children
    const selectedFolderData = folders.find(f => f.id === selectedFolder);
    if (selectedFolderData && selectedFolderData.parent_id) {
      const folderData = folders.find(f => f.id === folderId);
      // If the folder has the same parent as the selected folder (it's a sibling), allow it to show children
      if (folderData && folderData.parent_id === selectedFolderData.parent_id) {
        return true;
      }
    }
    
    return false;
  }, [selectedFolder, getSelectedFolderWithAncestry, folders]);
  
  /**
   * Event handlers
   */
  
  const toggleFolder = useCallback((folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  }, []);
  
  const handleFolderSelect = useCallback((folderId: string) => {
    onFolderSelect(folderId);
  }, [onFolderSelect]);
  
  const handleCreateFolder = useCallback(async () => {
    if (!folderName.trim()) {
      toast.error('Folder name cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createFolder(user.id, folderName, parentFolderId);
      setNewFolderDialogOpen(false);
      // Reset form 
      setFolderName("");
      setParentFolderId(null);
    } catch (error) {
      console.log('error: ', error);
      // Error is handled in the store
    } finally {
      setIsSubmitting(false);
    }
  }, [createFolder, folderName, parentFolderId, user]);
  
  const handleEditFolder = useCallback(async () => {
    if (!activeFolderId) {
      toast.error('Unable to update folder');
      return;
    }
    
    if (!folderName.trim()) {
      toast.error('Folder name cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await renameFolder(user.id, activeFolderId, folderName);
      setEditFolderDialogOpen(false);
      setFolderName("");
    } catch (error) {
      console.log('error: ', error);
      // Error is handled in the store
    } finally {
      setIsSubmitting(false);
    }
  }, [activeFolderId, folderName, renameFolder, user]);
  
  const handleDeleteFolder = useCallback(async () => {
    if (!activeFolderId) {
      toast.error('Unable to delete folder');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await deleteFolder(user.id, activeFolderId);
      
      // If we're deleting the selected folder, clear selection
      if (selectedFolder === activeFolderId) {
        onFolderSelect('');
      }
      
      setDeleteFolderDialogOpen(false);
    } catch (error) {
      console.log('error: ', error);
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  }, [activeFolderId, deleteFolder, onFolderSelect, selectedFolder, user]);

  // Handle drag and drop folder movement
  const handleMoveFolder = useCallback(async (folderId: string, newParentId: string | null) => {
    try {
      await moveFolder(user.id, folderId, newParentId);
    } catch (error) {
      console.log('error: ', error);
      // Error is handled in the store
    }
  }, [moveFolder, user.id]);
  
  const closeNewFolderDialog = useCallback(() => {
    setNewFolderDialogOpen(false);
    setFolderName("");
    setParentFolderId(null);
  }, []);
  
  const closeEditFolderDialog = useCallback(() => {
    setEditFolderDialogOpen(false);
    setFolderName("");
  }, []);
  
  const openEditDialog = useCallback((folder: FolderWithCount) => {
    setActiveFolderId(folder.id);
    // Important: Set the folder name AFTER setting the activeFolderId to avoid render issues
    setFolderName(folder.name);
    setEditFolderDialogOpen(true);
  }, []);
  
  const openNewFolderDialog = useCallback((parentId: string | null = null) => {
    // Clear existing values first
    setFolderName("");
    setParentFolderId(parentId);
    // Then open the dialog
    setNewFolderDialogOpen(true);
  }, []);
  
  const openDeleteDialog = useCallback((folderId: string) => {
    setActiveFolderId(folderId);
    setDeleteFolderDialogOpen(true);
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, folderId: string) => {
    e.stopPropagation();
    setDraggedFolderId(folderId);
    e.dataTransfer.setData('text/plain', folderId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedFolderId || draggedFolderId === folderId) return;
    
    // Prevent dropping on itself
    if (draggedFolderId === folderId) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    
    // Prevent dropping on its own descendants
    if (folderId && getAllDescendants(draggedFolderId).includes(folderId)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    
    e.dataTransfer.dropEffect = 'move';
    setDropTargetId(folderId);
    setIsDraggingOver(true);
  }, [draggedFolderId, getAllDescendants]);

  const handleDragEnd = useCallback(() => {
    setDraggedFolderId(null);
    setDropTargetId(null);
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDraggingOver(false);
    
    const folderId = e.dataTransfer.getData('text/plain');
    if (!folderId) return;
    
    // Prevent dropping on itself
    if (folderId === targetFolderId) return;
    
    // Prevent dropping into its own descendants
    if (targetFolderId && getAllDescendants(folderId).includes(targetFolderId)) {
      toast.error('Cannot move a folder into its own subfolder');
      return;
    }
    
    handleMoveFolder(folderId, targetFolderId);
    
    setDraggedFolderId(null);
    setDropTargetId(null);
  }, [getAllDescendants, handleMoveFolder]);
  
  /**
   * Rendering logic
   */
  
  // Recursive function to render folder items
  const renderFolderItems = useCallback((parentId: string | null, depth = 0) => {
    // Get folders that should be displayed at this level
    let foldersToRender = folders.filter(folder => folder.parent_id === parentId);
    
    // If we're in a specific folder view, filter to only show relevant folders
    if (selectedFolder) {
      foldersToRender = foldersToRender.filter(folder => 
        shouldShowFolderInSelectedView(folder.id)
      );
    }
    
    return foldersToRender.map(folder => {
      const hasChildren = folders.some(f => f.parent_id === folder.id);
      const canShowChildren = canHaveVisibleChildren(folder.id);
      const isExpanded = expandedFolders.includes(folder.id);
      const isSelected = selectedFolder === folder.id;
      const isBeingDragged = draggedFolderId === folder.id;
      const isDropTarget = dropTargetId === folder.id;
      
      return (
        <FolderItem
          key={folder.id}
          folder={folder}
          depth={depth}
          hasChildren={hasChildren}
          canShowChildren={canShowChildren}
          isExpanded={isExpanded}
          isSelected={isSelected}
          isBeingDragged={isBeingDragged}
          isDropTarget={isDropTarget}
          onToggleExpand={toggleFolder}
          onFolderSelect={handleFolderSelect}
          onEditFolder={openEditDialog}
          onNewSubfolder={openNewFolderDialog}
          onDeleteFolder={openDeleteDialog}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          renderChildren={renderFolderItems}
        />
      );
    });
  }, [
    folders, 
    selectedFolder, 
    shouldShowFolderInSelectedView, 
    canHaveVisibleChildren, 
    expandedFolders, 
    draggedFolderId,
    dropTargetId,
    handleFolderSelect, 
    toggleFolder, 
    openEditDialog, 
    openNewFolderDialog, 
    openDeleteDialog,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop
  ]);
  
  // Back to all bookmarks button component
  const BackToAllButton = useCallback(() => (
    <Button
      variant="ghost"
      size="sm"
      className="mb-4 text-muted-foreground flex items-center"
      onClick={() => onFolderSelect('')}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      All Conversations
    </Button>
  ), [onFolderSelect]);
  
  // Get all folders that should be visible in the current folder tree view
  const visibleFolders = getVisibleFolders();
  
  return (
    <div className="mt-2 space-y-1 animate-fade-in">
      {/* Show back button when a folder is selected */}
      {selectedFolder && <BackToAllButton />}
      
      {/* Root drop area for making folders root-level */}
      <div 
        ref={rootDropRef}
        className={cn(
          "p-2 rounded-md border border-dashed transition-colors mb-2",
          (isDraggingOver && dropTargetId === null) ? "border-primary bg-accent/30" : "border-transparent"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (draggedFolderId) {
            setDropTargetId(null);
            setIsDraggingOver(true);
          }
        }}
        onDragLeave={() => {
          if (dropTargetId === null) {
            setIsDraggingOver(false);
          }
        }}
        onDrop={(e) => handleDrop(e, null)}
      >
        {(isDraggingOver && dropTargetId === null) && (
          <div className="text-center text-sm text-muted-foreground">
            Drop here to make a root folder
          </div>
        )}
      </div>
      
      {/* Render folders based on the current view */}
      {renderFolderItems(null, 0)}
      
      {folders.length > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-2 w-full text-muted-foreground"
          onClick={() => openNewFolderDialog(null)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Root Folder
        </Button>
      )}
      
      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="glass-card">
          <FolderDialogs.NewFolderDialogContent
            folderName={folderName}
            setFolderName={updateFolderName}
            parentFolderId={parentFolderId}
            setParentFolderId={updateParentFolderId}
            handleCreateFolder={handleCreateFolder}
            onClose={closeNewFolderDialog}
            isSubmitting={isSubmitting}
            isFetching={isFetching}
            visibleFolders={visibleFolders}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Folder Dialog */}
      <Dialog open={editFolderDialogOpen} onOpenChange={setEditFolderDialogOpen}>
        <DialogContent className="glass-card">
          <FolderDialogs.EditFolderDialogContent
            folderName={folderName}
            setFolderName={updateFolderName}
            handleEditFolder={handleEditFolder}
            onClose={closeEditFolderDialog}
            isSubmitting={isSubmitting}
            isFetching={isFetching}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Folder Dialog */}
      <FolderDialogs.DeleteFolderDialog
        open={deleteFolderDialogOpen}
        onOpenChange={setDeleteFolderDialogOpen}
        folderName={folders.find(f => f.id === activeFolderId)?.name || "this folder"}
        hasBookmarks={!!folders.find(f => f.id === activeFolderId)?.bookmarkCount}
        onDelete={handleDeleteFolder}
        onCancel={() => setDeleteFolderDialogOpen(false)}
        isSubmitting={isSubmitting}
        isFetching={isFetching}
      />
    </div>
  );
};

export default FolderTree;