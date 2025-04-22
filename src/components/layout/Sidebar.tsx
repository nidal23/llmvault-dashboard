import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard,
  Bookmark,
  FolderTree,
  Settings,
  PlusCircle,
  ChevronRight,
  ChevronDown,
  X,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFoldersStore } from '@/lib/stores/useFoldersStore';
import { toast } from "react-hot-toast";
import TreeFolderSelector from "@/components/bookmarks/TreeFolderSelector";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Sidebar = ({ open, onOpenChange }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const lastFetchTime = useFoldersStore(state => state.lastFetchTime);
  
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  
  // Drag and drop state
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const { 
    folders, 
    isLoading, 
    error,
    createFolder: handleCreateFolder,
    moveFolder,
    fetchFolders
  } = useFoldersStore();

  const prevTimeRef = useRef(lastFetchTime);

  useEffect(() => {
    if (user) {
      // Only fetch if lastFetchTime has actually changed
      if (lastFetchTime !== prevTimeRef.current) {
        fetchFolders(user.id);
        prevTimeRef.current = lastFetchTime;
      } else if (folders.length === 0) {
        // Initial fetch if no folders are loaded
        fetchFolders(user.id);
      }
    }
  }, [user, fetchFolders, lastFetchTime, folders.length]);
  
  useEffect(() => {
    if (user) {
      fetchFolders(user.id);
    }
  }, [user, fetchFolders]);
  
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

  const toggleFolder = (folderId: string) => {
    if (expandedFolders.includes(folderId)) {
      setExpandedFolders(expandedFolders.filter(id => id !== folderId));
    } else {
      setExpandedFolders([...expandedFolders, folderId]);
    }
  };

  const handleFolderClick = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Navigate to bookmarks page with the folder ID
    navigate(`/bookmarks?folder=${folderId}`);
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      onOpenChange(false);
    }
  };
  
  // Handle create folder
  const submitCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name cannot be empty');
      return;
    }
    
    try {
      // Note we now need to pass user.id
      await handleCreateFolder(user.id, newFolderName, parentFolderId);
      
      // Reset form and close dialog
      setNewFolderName("");
      setParentFolderId(null);
      setIsNewFolderOpen(false);
    } catch (error) {
      console.log('error:', error)
      // Error is handled inside the store with toast messages
    }
  };
  
  // Handle sidebar for mobile devices
  const handleCloseSidebar = () => {
    if (window.innerWidth < 768) {
      onOpenChange(false);
    }
  };
  
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

  const handleDrop = useCallback(async (e: React.DragEvent, targetFolderId: string | null) => {
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
    
    try {
      await moveFolder(user.id, folderId, targetFolderId);
    } catch (error) {
      console.log('error:', error);
      // Error is handled in the store
    }
    
    setDraggedFolderId(null);
    setDropTargetId(null);
  }, [getAllDescendants, moveFolder, user?.id]);
  
  // Create a recursive function to render folders
  const renderFolderTree = (parentId: string | null) => {
    const childFolders = folders.filter(folder => folder.parent_id === parentId);
    
    return childFolders.map(folder => {
      const hasChildren = folders.some(f => f.parent_id === folder.id);
      const isExpanded = expandedFolders.includes(folder.id);
      const isBeingDragged = draggedFolderId === folder.id;
      const isDropTarget = dropTargetId === folder.id;
      
      return (
        <div 
          key={folder.id} 
          className="ml-3"
          draggable
          onDragStart={(e) => handleDragStart(e, folder.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDrop={(e) => handleDrop(e, folder.id)}
        >
          <div 
            className={cn(
              "flex items-center py-1 px-2 rounded-md hover:bg-accent cursor-pointer text-sm",
              isDropTarget && "bg-accent/70 outline outline-1 outline-primary",
              isBeingDragged && "opacity-50"
            )}
            onClick={(e) => handleFolderClick(folder.id, e)}
          >
            {hasChildren ? (
              <div onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 mr-1 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1 text-muted-foreground" />
                )}
              </div>
            ) : (
              <div className="w-4 mr-1" />
            )}
            <FolderTree className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{folder.name}</span>
            {(folder.bookmarkCount !== undefined && folder.bookmarkCount > 0) && (
              <span className="ml-auto text-xs text-muted-foreground">
                {folder.bookmarkCount}
              </span>
            )}
          </div>
          
          {isExpanded && hasChildren && (
            <div className="pl-2 border-l border-border ml-3 mt-1">
              {renderFolderTree(folder.id)}
            </div>
          )}
        </div>
      );
    });
  };
  
  // Root drop area for making folders root-level
  const RootDropArea = () => (
    <div 
      className={cn(
        "p-2 rounded-md border border-dashed transition-colors my-2",
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
        <div className="text-center text-xs text-muted-foreground">
          Drop here to make a root folder
        </div>
      )}
    </div>
  );
  
  if (!open) {
    return null;
  }
  
  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-black/50 md:hidden ${open ? "block" : "hidden"}`} 
        onClick={() => onOpenChange(false)}
      />
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar glass-morphism border-r border-border md:glass-card transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-semibold text-xl text-sidebar-foreground">ConvoStack</span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>
        
        <ScrollArea className="flex-1 px-4 py-4 h-[calc(100vh-4rem)]">
          <div className="flex flex-col gap-1">
            <Link 
              to="/dashboard" 
              className={`menu-item ${location.pathname === "/dashboard" ? "menu-item-active" : ""}`}
              onClick={handleCloseSidebar}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/bookmarks" 
              className={`menu-item ${location.pathname === "/bookmarks" ? "menu-item-active" : ""}`}
              onClick={handleCloseSidebar}
            >
              <Bookmark className="h-5 w-5" />
              <span>All Conversations</span>
            </Link>
            <Link 
              to="/settings" 
              className={`menu-item ${location.pathname === "/settings" ? "menu-item-active" : ""}`}
              onClick={handleCloseSidebar}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Folders</h3>
            <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <PlusCircle className="h-4 w-4" />
                  <span className="sr-only">New folder</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card">
                <DialogHeader>
                  <DialogTitle>New Folder</DialogTitle>
                  <DialogDescription>
                    Create a new folder to organize your conversations.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter folder name"
                      className="col-span-3"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="parent" className="text-right">
                      Parent
                    </Label>
                    <div className="col-span-3">
                      {/* Using the Tree Folder Selector instead of a basic dropdown */}
                      <TreeFolderSelector
                        folders={folders}
                        selectedFolderId={parentFolderId || ""}
                        onSelect={(id) => setParentFolderId(id === "" ? null : id)}
                        placeholder="None (Root folder)"
                        className="w-full"
                      />
                      {/* Show an option to reset to root */}
                      {parentFolderId && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-1 text-xs text-muted-foreground"
                          onClick={() => setParentFolderId(null)}
                        >
                          Clear parent (Make root folder)
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsNewFolderOpen(false);
                      setNewFolderName("");
                      setParentFolderId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    onClick={submitCreateFolder}
                    disabled={!newFolderName.trim()}
                  >
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="mt-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Loading folders...</span>
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">
                <p className="text-sm">Error loading folders</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : folders.length > 0 ? (
              <>
                <RootDropArea />
                {renderFolderTree(null)}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No folders yet</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2"
                  onClick={() => setIsNewFolderOpen(true)}
                >
                  Create your first folder
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};

export default Sidebar;