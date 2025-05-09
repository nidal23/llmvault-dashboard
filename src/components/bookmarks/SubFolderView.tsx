import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FolderWithCount } from "@/lib/supabase/database.types";
import { 
  FolderTree, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  MoreHorizontal,
  Edit2, 
  Trash 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useFoldersStore } from "@/lib/stores/useFoldersStore";
import { useAuth } from "@/lib/hooks/useAuth";

interface SubFolderViewProps {
  folders: FolderWithCount[];
  currentFolderId: string;
  maxHeight?: number; // Maximum height in pixels
}

const SubFolderView = ({ folders, currentFolderId, maxHeight = 300 }: SubFolderViewProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { renameFolder, deleteFolder } = useFoldersStore();
  
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get the current folder
  const currentFolder = folders.find(f => f.id === currentFolderId);
  
  // Auto-expand direct children of the current folder
  useEffect(() => {
    if (currentFolderId) {
      setExpandedFolders(prev => {
        if (!prev.includes(currentFolderId)) {
          return [...prev, currentFolderId];
        }
        return prev;
      });
    }
  }, [currentFolderId]);
  
  // Toggle folder expansion
  const toggleFolder = useCallback((folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  }, []);
  
  // Handle folder selection
  const handleFolderSelect = useCallback((folderId: string) => {
    navigate(`/bookmarks?folder=${folderId}`);
  }, [navigate]);
  
  // Handle rename folder
  const openRenameDialog = (folderId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveFolderId(folderId);
    setNewFolderName(name);
    setIsRenameDialogOpen(true);
  };
  
  const handleRenameFolder = async () => {
    if (!user || !activeFolderId || !newFolderName.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await renameFolder(user.id, activeFolderId, newFolderName);
      setIsRenameDialogOpen(false);
    } catch (error) {
      console.error("Error renaming folder:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle delete folder
  const openDeleteDialog = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveFolderId(folderId);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteFolder = async () => {
    if (!user || !activeFolderId) return;
    
    setIsSubmitting(true);
    
    try {
      await deleteFolder(user.id, activeFolderId);
      setIsDeleteDialogOpen(false);
      
      // If we're deleting the current folder, navigate to parent or all bookmarks
      if (activeFolderId === currentFolderId) {
        const folderToDelete = folders.find(f => f.id === activeFolderId);
        if (folderToDelete?.parent_id) {
          navigate(`/bookmarks?folder=${folderToDelete.parent_id}`);
        } else {
          navigate('/bookmarks');
        }
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filter folders based on search query
  const getFilteredFolders = useCallback(() => {
    if (!searchQuery.trim()) {
      // If no search, return all
      return folders;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    
    // First, find all folders that match the search
    const matchingFolders = folders.filter(folder => 
      folder.name.toLowerCase().includes(lowerQuery)
    );
    
    // Then find all parents of matching folders to maintain hierarchy
    const parentIds = new Set<string>();
    
    const findAllParents = (folderId: string | null) => {
      if (!folderId) return;
      
      const folder = folders.find(f => f.id === folderId);
      if (!folder) return;
      
      if (folder.parent_id) {
        parentIds.add(folder.parent_id);
        findAllParents(folder.parent_id);
      }
    };
    
    // Get all parents of matching folders
    matchingFolders.forEach(folder => {
      findAllParents(folder.id);
    });
    
    // Return both matching folders and their parents
    return folders.filter(folder => 
      matchingFolders.some(f => f.id === folder.id) || parentIds.has(folder.id)
    );
  }, [folders, searchQuery]);
  
  // Get folders to display (filtered if search is active)
  const filteredFolders = getFilteredFolders();
  
  // Check if we should highlight a folder (used for search results)
  const shouldHighlight = useCallback((folderName: string) => {
    if (!searchQuery.trim()) return false;
    return folderName.toLowerCase().includes(searchQuery.toLowerCase());
  }, [searchQuery]);
  
  // Recursive function to render folder tree with correct indentation
  const renderFolderTree = useCallback((parentId: string | null, depth = 0) => {
    // Get direct children of the parent
    const childFolders = filteredFolders.filter(folder => folder.parent_id === parentId);
    
    if (childFolders.length === 0) return null;
    
    return (
      <div className="space-y-1">
        {childFolders.map(folder => {
          const hasChildren = filteredFolders.some(f => f.parent_id === folder.id);
          const isExpanded = expandedFolders.includes(folder.id);
          const isHighlighted = shouldHighlight(folder.name);
          
          return (
            <div key={folder.id} className="group">
              <div
                className={cn(
                  "flex items-center py-1.5 px-2 rounded-md cursor-pointer text-sm transition-colors relative",
                  folder.id === currentFolderId ? "bg-primary/15 text-primary font-medium" : "hover:bg-accent/50",
                  isHighlighted && "bg-yellow-500/10 border border-yellow-500/50",
                  !isHighlighted && "border border-transparent"
                )}
                onClick={() => handleFolderSelect(folder.id)}
                style={{ marginLeft: `${depth * 16}px` }}
              >
                {/* Toggle expander */}
                <div 
                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center mr-1"
                  onClick={(e) => hasChildren ? toggleFolder(folder.id, e) : null}
                >
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )
                  ) : (
                    <span className="w-4" />
                  )}
                </div>
                
                <FolderTree className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
                
                {/* Label with truncation */}
                <span className="truncate flex-1 mr-2">{folder.name}</span>
                
                {/* Stats with subfolder count and bookmark count */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Subfolder count */}
                  {hasChildren && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
                      {filteredFolders.filter(f => f.parent_id === folder.id).length}
                    </span>
                  )}
                  
                  {/* Bookmark count */}
                  {(folder.bookmarkCount !== undefined && folder.bookmarkCount > 0) && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {folder.bookmarkCount}
                    </span>
                  )}
                </div>
                
                {/* Actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={(e) => openRenameDialog(folder.id, folder.name, e)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => openDeleteDialog(folder.id, e)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Render children if expanded */}
              {hasChildren && isExpanded && renderFolderTree(folder.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  }, [
    filteredFolders, 
    expandedFolders, 
    currentFolderId, 
    shouldHighlight, 
    handleFolderSelect, 
    toggleFolder
  ]);
  
  // If there are no subfolders, don't render anything
  const hasSubfolders = folders.some(folder => folder.parent_id === currentFolderId);
  
  if (!hasSubfolders) {
    return null;
  }
  
  return (
    <div className="mt-2 mb-4 animate-fade-in">
      <h3 className="text-sm font-medium mb-2 text-muted-foreground flex items-center">
        <FolderTree className="h-4 w-4 mr-1.5 text-amber-500" />
        Subfolders in {currentFolder?.name || "current folder"}
      </h3>
      
      <div className="border border-border/40 rounded-md p-3 bg-background/50 max-w-3xl">
        {/* Search box for many subfolders */}
        {folders.filter(folder => folder.parent_id === currentFolderId).length > 5 && (
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subfolders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        )}
        
        {/* Scrollable area with max height */}
        <ScrollArea className={`pr-4 ${maxHeight ? `max-h-[${maxHeight}px]` : ''}`}>
          {renderFolderTree(currentFolderId)}
        </ScrollArea>
      </div>
      
      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
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
              onClick={() => setIsRenameDialogOpen(false)}
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this folder? This action cannot be undone.
              
              {activeFolderId && folders.find(f => f.id === activeFolderId)?.bookmarkCount ? (
                <div className="mt-2 text-destructive">
                  Warning: This folder contains bookmarks that will also be deleted.
                </div>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
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
  );
};

export default SubFolderView;