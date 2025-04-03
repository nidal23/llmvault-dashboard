import { useState, useEffect } from "react";
import { 
  FolderTree as FolderIcon, 
  ChevronRight, 
  ChevronDown, 
  MoreVertical,
  Edit,
  Trash,
  Plus,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { FolderWithCount } from "@/lib/supabase/database.types";
import { useFoldersStore } from '@/lib/stores/useFoldersStore';
import { useAuth } from "@/lib/hooks/useAuth";

interface FolderTreeProps {
  folders: FolderWithCount[];
  selectedFolder?: string;
  onFolderSelect: (folderId: string) => void;
}

interface FolderFormProps {
  title: string;
  description: string;
  onSubmit: () => void;
  initialName?: string;
}

const FolderTree = ({ folders, selectedFolder, onFolderSelect }: FolderTreeProps) => {
  // Use the custom folder hook
  const { 
    createFolder,
    renameFolder,
    deleteFolder,
    isFetching
  } = useFoldersStore();

  const { user } = useAuth();
  
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [editFolderDialogOpen, setEditFolderDialogOpen] = useState(false);
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };
  
  const handleFolderSelect = (folderId: string) => {
    onFolderSelect(folderId);
  };
  
  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast.error('Folder name cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createFolder(user.id, folderName, activeFolderId);
      setNewFolderDialogOpen(false);
      setFolderName("");
    } catch (error) {
      console.log('error: ', error);
      // Error is handled in the store
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditFolder = async () => {
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
  };
  
  const handleDeleteFolder = async () => {
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
  };
  
  const openEditDialog = (folder: FolderWithCount) => {
    setActiveFolderId(folder.id);
    setFolderName(folder.name);
    setEditFolderDialogOpen(true);
  };
  
  const openNewFolderDialog = (parentId: string) => {
    setActiveFolderId(parentId);
    setFolderName("");
    setNewFolderDialogOpen(true);
  };
  
  const openDeleteDialog = (folderId: string) => {
    setActiveFolderId(folderId);
    setDeleteFolderDialogOpen(true);
  };
  
  // Function to get the selected folder's ancestry chain (including self)
  const getSelectedFolderWithAncestry = (): string[] => {
    if (!selectedFolder) return [];
    
    const ancestry: string[] = [selectedFolder];
    let currentFolder = folders.find(f => f.id === selectedFolder);
    
    while (currentFolder?.parent_id) {
      ancestry.push(currentFolder.parent_id);
      currentFolder = folders.find(f => f.id === currentFolder?.parent_id);
    }
    
    return ancestry;
  };
  
  // Function to recursively get all descendants of a folder
  const getAllDescendants = (folderId: string): string[] => {
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
  };
  
  // Determine if a folder should be shown in the tree when a specific folder is selected
  const shouldShowFolderInSelectedView = (folderId: string): boolean => {
    if (!selectedFolder) return true; // Show all in "All Bookmarks" view
    
    const ancestry = getSelectedFolderWithAncestry();
    
    // If this folder is the selected folder or in its ancestry chain, show it
    if (ancestry.includes(folderId)) return true;
    
    // If this folder is a descendant of the selected folder, show it
    const allDescendants = getAllDescendants(selectedFolder);
    return allDescendants.includes(folderId);
  };
  
  // Determine if a folder can have visible children
  const canHaveVisibleChildren = (folderId: string): boolean => {
    if (!selectedFolder) return true; // In "All Bookmarks" view, all folders can show children
    
    // In selected folder view, only the selected folder and its ancestors can show their children
    const ancestry = getSelectedFolderWithAncestry();
    return folderId === selectedFolder || ancestry.includes(folderId);
  };
  
  const renderFolderItems = (parentId: string | null, depth = 0) => {
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
      
      return (
        <div key={folder.id} className="group">
          <div 
            className={cn(
              "flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer text-sm group/item",
              isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
              depth > 0 && "ml-4"
            )}
            onClick={() => handleFolderSelect(folder.id)}
          >
            <div className="flex items-center min-w-0">
              {hasChildren && canShowChildren && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 mr-1 p-0"
                  onClick={(e) => toggleFolder(folder.id, e)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              {(!hasChildren || !canShowChildren) && <div className="w-5 mr-1" />}
              
              <FolderIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{folder.name}</span>
              {folder.bookmarkCount !== undefined && folder.bookmarkCount > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({folder.bookmarkCount})
                </span>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFolderId(folder.id);
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card w-40">
                <DropdownMenuItem
                  onClick={() => {
                    openEditDialog(folder);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    openNewFolderDialog(folder.id);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>New Subfolder</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    openDeleteDialog(folder.id);
                  }}
                  className="text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {hasChildren && canShowChildren && isExpanded && (
            <div className="pl-2 border-l border-border ml-6 mt-1 transition-all">
              {renderFolderItems(folder.id, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };
  
  // Folder dialog forms
  const FolderForm = ({ title, description, onSubmit, initialName = "" }: FolderFormProps) => {
    // Set initial folder name when dialog opens
    if (initialName && folderName !== initialName) {
      setFolderName(initialName);
    }
    
    return (
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folder-name" className="text-right">
                Name
              </Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || isFetching}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    );
  };
  
  // Create a "New Root Folder" button at the bottom of the tree
  const AddRootFolderButton = () => (
    <Button 
      variant="ghost" 
      size="sm" 
      className="mt-2 w-full text-muted-foreground"
      onClick={() => {
        setActiveFolderId(null);
        setFolderName("");
        setNewFolderDialogOpen(true);
      }}
    >
      <Plus className="mr-2 h-4 w-4" />
      New Root Folder
    </Button>
  );
  
  // Render back to all bookmarks button
  const BackToAllButton = () => (
    <Button
      variant="ghost"
      size="sm"
      className="mb-4 text-muted-foreground flex items-center"
      onClick={() => onFolderSelect('')}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      All Bookmarks
    </Button>
  );
  
  return (
    <div className="mt-2 space-y-1 animate-fade-in">
      {/* Show back button when a folder is selected */}
      {selectedFolder && <BackToAllButton />}
      
      {/* Render folders based on the current view */}
      {renderFolderItems(null, 0)}
      
      {folders.length > 0 && <AddRootFolderButton />}
      
      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <FolderForm
          title="New Folder"
          description="Create a new folder to organize your bookmarks."
          onSubmit={handleCreateFolder}
        />
      </Dialog>
      
      {/* Edit Folder Dialog */}
      <Dialog open={editFolderDialogOpen} onOpenChange={setEditFolderDialogOpen}>
        <FolderForm
          title="Edit Folder"
          description="Update the folder name."
          initialName={folders.find(f => f.id === activeFolderId)?.name || ""}
          onSubmit={handleEditFolder}
        />
      </Dialog>
      
      {/* Delete Folder Dialog */}
      <Dialog open={deleteFolderDialogOpen} onOpenChange={setDeleteFolderDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this folder? This action cannot be undone.
              
              {folders.find(f => f.id === activeFolderId)?.bookmarkCount ? (
                <div className="mt-2 text-destructive">
                  Warning: This folder contains bookmarks that will also be deleted.
                </div>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteFolder}
              disabled={isSubmitting || isFetching}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FolderTree;