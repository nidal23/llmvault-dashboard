import BookmarkList from "@/components/bookmarks/BookmarkList";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBookmarksStore } from "@/lib/stores/useBookmarksStore";
import { Loader2, Plus, Edit2, Trash } from "lucide-react";
import { useFoldersStore } from '@/lib/stores/useFoldersStore';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Bookmarks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const folderParam = query.get('folder');
  const { user } = useAuth();
  
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderParam);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  
  // Add state for folder management
  const [isRenameFolderDialogOpen, setIsRenameFolderDialogOpen] = useState(false);
  const [isDeleteFolderDialogOpen, setIsDeleteFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    folders,
    fetchFolders,
    renameFolder,
    deleteFolder
  } = useFoldersStore();
  
  const { 
    bookmarks, 
    isLoading: isLoadingBookmarks,
    error: bookmarksError,
    updateFilters,
    fetchBookmarks,
    lastFetchTime
  } = useBookmarksStore();

  // Initial load of folders
  useEffect(() => {
    if (user) {
      fetchFolders(user.id);
    }
  }, [user, fetchFolders]);

  // Update selected folder name whenever folders or selected folder changes
  useEffect(() => {
    if (selectedFolder && folders.length > 0) {
      const folder = folders.find(f => f.id === selectedFolder);
      setSelectedFolderName(folder?.name || null);
      
      // Update rename dialog name when selected folder changes
      if (folder) {
        setNewFolderName(folder.name);
      }
    } else {
      setSelectedFolderName(null);
    }
  }, [selectedFolder, folders]);

  // Initial load of bookmarks
  useEffect(() => {
    if (user && selectedFolder !== undefined) {
      fetchBookmarks(user.id, {
        folderId: selectedFolder || undefined
      });
    }
  }, [user, selectedFolder, fetchBookmarks]);

  // Update selected folder state when URL parameter changes
  useEffect(() => {
    const currentFolderParam = query.get('folder');
    
    // Only update if folder parameter has changed
    if (currentFolderParam !== selectedFolder) {
      setSelectedFolder(currentFolderParam);
      
      // Update bookmarks filter when folder changes
      if (user) {
        updateFilters({ folderId: currentFolderParam || undefined });
        fetchBookmarks(user.id, { folderId: currentFolderParam || undefined });
      }
    }
  }, [location, query, selectedFolder, user, updateFilters, fetchBookmarks]);
  
  // Refresh folders data when bookmarks change
  useEffect(() => {
    if (user && lastFetchTime > 0) {
      fetchFolders(user.id);
    }
  }, [lastFetchTime, user, fetchFolders]);
  
  // Function to handle folder rename
  const handleRenameFolder = async () => {
    if (!user || !selectedFolder || !newFolderName.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await renameFolder(user.id, selectedFolder, newFolderName);
      setIsRenameFolderDialogOpen(false);
      toast.success("Folder renamed successfully");
      
      // Refresh folders to update the UI
      fetchFolders(user.id);
    } catch (error) {
      console.error("Error renaming folder:", error);
      toast.error("Failed to rename folder");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to handle folder deletion
  const handleDeleteFolder = async () => {
    if (!user || !selectedFolder) return;
    
    setIsSubmitting(true);
    
    try {
      await deleteFolder(user.id, selectedFolder);
      setIsDeleteFolderDialogOpen(false);
      toast.success("Folder deleted successfully");
      
      // Navigate back to all bookmarks
      navigate("/bookmarks");
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error("Failed to delete folder");
      setIsSubmitting(false);
    }
  };
  
  // Get selected folder with bookmark count
  const selectedFolderData = selectedFolder ? folders.find(f => f.id === selectedFolder) : null;
  
  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Breadcrumb navigation with Add button and folder options */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              {selectedFolderName ? selectedFolderName : "All Conversations"}
            </h1>
            
            {/* Direct action buttons - only show when folder is selected */}
            {selectedFolder && (
              <div className="flex items-center gap-1 ml-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full flex items-center justify-center text-primary/80 hover:text-primary hover:bg-accent cursor-pointer"
                  onClick={() => setIsRenameFolderDialogOpen(true)}
                  aria-label="Rename folder"
                  title="Rename folder"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full flex items-center justify-center text-destructive/80 hover:text-destructive cursor-pointer"
                  onClick={() => setIsDeleteFolderDialogOpen(true)}
                  aria-label="Delete folder"
                  title="Delete folder"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Add Conversation button */}
          <Button 
            className="apple-button sm:flex" 
            onClick={() => {
              // Find the existing new bookmark button in BookmarkList and click it
              const addButton = document.querySelector('.bookmark-add-button');
              if (addButton && addButton instanceof HTMLElement) {
                addButton.click();
              }
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Conversation
          </Button>
        </div>
        
        {/* Main content area */}
        <div className="flex-1">
          {isLoadingBookmarks ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading conversations...</span>
            </div>
          ) : bookmarksError ? (
            <div className="flex items-center justify-center py-8 text-red-500">
              <p>Error loading conversations</p>
            </div>
          ) : (
            <BookmarkList 
              bookmarks={bookmarks} 
              folderId={selectedFolder || undefined}
              folderName={selectedFolderName || undefined}
              onBookmarksChange={() => {
                // This ensures we refresh folder counts when a bookmark is created/updated/deleted
                if (user) {
                  fetchFolders(user.id);
                }
              }}
            />
          )}
        </div>
        
        {/* Rename Folder Dialog */}
        <Dialog open={isRenameFolderDialogOpen} onOpenChange={setIsRenameFolderDialogOpen}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Rename Folder</DialogTitle>
              <DialogDescription>
                Enter a new name for this folder.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="folderName" className="text-right">
                  Name
                </Label>
                <Input
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="col-span-3"
                  autoFocus
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsRenameFolderDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRenameFolder}
                disabled={isSubmitting || !newFolderName.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Folder Dialog */}
        <Dialog open={isDeleteFolderDialogOpen} onOpenChange={setIsDeleteFolderDialogOpen}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Delete Folder</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this folder? This action cannot be undone.
                
                {selectedFolderData && selectedFolderData.bookmarkCount !== undefined && selectedFolderData.bookmarkCount > 0 && (
                  <div className="mt-2 text-destructive">
                    Warning: This folder contains {selectedFolderData.bookmarkCount} conversation(s) that will also be deleted.
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteFolderDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteFolder}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Folder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Bookmarks;