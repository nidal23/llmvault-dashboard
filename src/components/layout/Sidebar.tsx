import { useState } from "react";
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
import { useAuth } from "@/lib/context/AuthContext";
import { useFolders } from "@/lib/hooks/useFolders";
import { toast } from "react-hot-toast";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Sidebar = ({ open, onOpenChange }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { initialized } = useAuth();
  
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  
  // Use the folders hook instead of manually managing state and API calls
  const { 
    folders, 
    isLoading, 
    error,
    createFolder: handleCreateFolder 
  } = useFolders({ 
    autoFetch: initialized 
  });

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
      await handleCreateFolder(newFolderName, parentFolderId);
      
      // Reset form and close dialog
      setNewFolderName("");
      setParentFolderId(null);
      setIsNewFolderOpen(false);
    } catch (error) {
      console.log('error:', error)
      // Error is handled inside the hook with toast messages
    }
  };
  
  // Handle sidebar for mobile devices
  const handleCloseSidebar = () => {
    if (window.innerWidth < 768) {
      onOpenChange(false);
    }
  };
  
  // Create a recursive function to render folders
  const renderFolderTree = (parentId: string | null) => {
    const childFolders = folders.filter(folder => folder.parent_id === parentId);
    
    return childFolders.map(folder => {
      const hasChildren = folders.some(f => f.parent_id === folder.id);
      const isExpanded = expandedFolders.includes(folder.id);
      
      return (
        <div key={folder.id} className="ml-3">
          <div 
            className="flex items-center py-1 px-2 rounded-md hover:bg-accent cursor-pointer text-sm"
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
            <span className="font-semibold text-xl text-sidebar-foreground">ChatBook</span>
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
              <span>All Bookmarks</span>
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
                    Create a new folder to organize your bookmarks.
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
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="parent" className="text-right">
                      Parent
                    </Label>
                    <select
                      id="parent"
                      className="col-span-3"
                      value={parentFolderId || ""}
                      onChange={(e) => setParentFolderId(e.target.value || null)}
                    >
                      <option value="">None (Root folder)</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={submitCreateFolder}>Create</Button>
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
              renderFolderTree(null)
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