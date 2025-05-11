import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  Loader2,
  Search,
  Wand2,
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

// Maximum nesting level for visual indentation - prevent overflow
const MAX_INDENT_LEVEL = 4; // Reduced from 5 to 4

const Sidebar = ({ open, onOpenChange }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const lastFetchTime = useFoldersStore(state => state.lastFetchTime);
  
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
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

  // Extract current folder ID from the URL
  const query = new URLSearchParams(location.search);
  const currentFolderId = query.get('folder');

  // Auto-expand current folder and its parents
  useEffect(() => {
    if (currentFolderId) {
      // Find all parent folders of the current folder
      const findParentChain = (folderId: string, chain: string[] = []): string[] => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder || !folder.parent_id) return chain;
        return findParentChain(folder.parent_id, [...chain, folder.parent_id]);
      };
      
      const parentChain = findParentChain(currentFolderId);
      
      // Add current folder and all its parents to expanded list
      setExpandedFolders(prev => {
        const newExpanded = [...prev];
        [...parentChain, currentFolderId].forEach(id => {
          if (!newExpanded.includes(id)) {
            newExpanded.push(id);
          }
        });
        return newExpanded;
      });
    }
  }, [currentFolderId, folders]);

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

  const toggleFolder = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setExpandedFolders(prev => {
      if (prev.includes(folderId)) {
        return prev.filter(id => id !== folderId);
      } else {
        return [...prev, folderId];
      }
    });
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
    
    if (newFolderName.length > 25) {
      toast.error('Folder name cannot exceed 25 characters');
      return;
    }
    
    try {
      // Truncate to 25 characters if somehow it exceeded the limit
      const folderName = newFolderName.substring(0, 25);
      await handleCreateFolder(user.id, folderName, parentFolderId);
      
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
  
  // Filter folders based on search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery || !folders) return folders;
    
    const searchLower = searchQuery.toLowerCase();
    
    // First find folders that match
    const matchingFolders = folders.filter(folder => 
      folder.name.toLowerCase().includes(searchLower)
    );
    
    // Get all parent folder IDs to maintain hierarchy
    const parentIds = new Set<string>();
    
    const getParentChain = (folderId: string | null) => {
      if (!folderId) return;
      
      parentIds.add(folderId);
      const parent = folders.find(f => f.id === folderId)?.parent_id;
      if (parent) getParentChain(parent);
    };
    
    // Get all parent folders for each matching folder
    matchingFolders.forEach(folder => {
      getParentChain(folder.parent_id);
    });
    
    // Return matching folders + their parent folders
    return folders.filter(folder => 
      matchingFolders.some(f => f.id === folder.id) || parentIds.has(folder.id)
    );
  }, [folders, searchQuery]);
  
  // Create a recursive function to render folders
  // Modified to handle deep nesting more gracefully
  const renderFolderTree = (parentId: string | null, depth = 0) => {
    const childFolders = filteredFolders.filter(folder => folder.parent_id === parentId);
    
    // Sort folders alphabetically
    childFolders.sort((a, b) => a.name.localeCompare(b.name));
    
    return childFolders.map(folder => {
      const hasChildren = filteredFolders.some(f => f.parent_id === folder.id);
      const isExpanded = expandedFolders.includes(folder.id);
      const isSelected = currentFolderId === folder.id;
      const isBeingDragged = draggedFolderId === folder.id;
      const isDropTarget = dropTargetId === folder.id;
      
      // Limit visual indentation to prevent overflow
      const visualDepth = Math.min(depth, MAX_INDENT_LEVEL);
      const isDeeplyNested = depth > MAX_INDENT_LEVEL;
      
      // Highlight folders that match search
      const isSearchMatch = searchQuery && folder.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return (
        <div 
          key={folder.id} 
          className={cn(
            "relative group",
            isDeeplyNested && "border-l-2 border-primary/20"
          )}
          draggable
          onDragStart={(e) => handleDragStart(e, folder.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDrop={(e) => handleDrop(e, folder.id)}
        >
          <div 
            className={cn(
              "flex items-center py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer text-sm relative",
              isDropTarget && "bg-accent/70 outline outline-1 outline-primary",
              isBeingDragged && "opacity-50",
              isSelected && "bg-accent text-accent-foreground",
              isSearchMatch && "bg-yellow-500/10",
              "overflow-hidden"
            )}
            style={{ marginLeft: `${visualDepth * 3}px` }} // Even smaller indent (3px)
            onClick={(e) => handleFolderClick(folder.id, e)}
          >
            {/* For deeply nested folders, add a depth indicator */}
            {isDeeplyNested && (
              <span className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-4 text-[10px] text-muted-foreground opacity-70">
                {depth - MAX_INDENT_LEVEL + 1}
              </span>
            )}
            
            {/* Toggle expander */}
            <div 
              className="w-4 h-4 mr-0.5 flex items-center justify-center flex-shrink-0"
              onClick={(e) => hasChildren ? toggleFolder(folder.id, e) : undefined}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )
              ) : (
                <span className="w-3" />
              )}
            </div>
            
            {/* Folder icon */}
            <FolderTree className="h-3.5 w-3.5 mr-1 text-muted-foreground flex-shrink-0" />
            
            {/* Folder name with truncation to 12 characters */}
            <span className="folder-name" title={folder.name}>
              {folder.name.length > 18 ? folder.name.substring(0, 18) + '...' : folder.name}
            </span>
            
            <div className="folder-badges">
              {/* Subfolder count */}
              {hasChildren && (
                <span className="count-badge folder-badge">
                  {filteredFolders.filter(f => f.parent_id === folder.id).length}
                </span>
              )}
              
              {/* Bookmark count */}
              {(folder.bookmarkCount !== undefined && folder.bookmarkCount > 0) && (
                <span className="count-badge bookmark-badge">
                  {folder.bookmarkCount}
                </span>
              )}
            </div>
            
            {/* Actions menu button (added on hover) could go here */}
          </div>
          
          {/* Render children if expanded */}
          {isExpanded && hasChildren && (
            <div>
              {renderFolderTree(folder.id, depth + 1)}
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
        <div className="flex h-16 items-center justify-between px-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-semibold text-lg text-sidebar-foreground">ConvoStack</span>
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
        
        <ScrollArea className="flex-1 px-2 py-4 h-[calc(100vh-4rem)]">
          <div className="flex flex-col gap-1">
            <Link 
              to="/dashboard" 
              className={`menu-item ${location.pathname === "/dashboard" ? "menu-item-active" : ""}`}
              onClick={handleCloseSidebar}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="ml-2">Dashboard</span>
            </Link>
            <Link 
              to="/bookmarks" 
              className={`menu-item ${location.pathname === "/bookmarks" ? "menu-item-active" : ""}`}
              onClick={handleCloseSidebar}
            >
              <Bookmark className="h-4 w-4" />
              <span className="ml-2">All Conversations</span>
            </Link>
            <Link 
              to="/prompts" 
              className={`menu-item ${location.pathname === "/prompts" ? "menu-item-active" : ""}`}
              onClick={handleCloseSidebar}
            >
              <Wand2 className="h-4 w-4" />
              <span className="ml-2">Prompt Studio</span>
            </Link>
            <Link 
              to="/settings" 
              className={`menu-item ${location.pathname === "/settings" ? "menu-item-active" : ""}`}
              onClick={handleCloseSidebar}
            >
              <Settings className="h-4 w-4" />
              <span className="ml-2">Settings</span>
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
                      onChange={(e) => setNewFolderName(e.target.value.substring(0, 25))}
                      maxLength={25}
                      autoFocus
                    />
                    <p className="col-span-3 col-start-2 text-xs text-muted-foreground mt-1">
                      {newFolderName.length}/25 characters
                    </p>
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
          
          {/* Add search box to quickly filter folders */}
          {folders.length > 7 && (
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search folders..."
                className="h-7 pl-8 text-sm py-1"
              />
              {searchQuery && (
                <Button
                  variant="ghost" 
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 hover:bg-transparent"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          
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