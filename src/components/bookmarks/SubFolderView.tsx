import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FolderWithCount } from "@/lib/supabase/database.types";
import { FolderTree, ChevronDown, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface SubFolderViewProps {
  folders: FolderWithCount[];
  currentFolderId: string;
  maxHeight?: number; // Maximum height in pixels
}

const SubFolderView = ({ folders, currentFolderId, maxHeight = 300 }: SubFolderViewProps) => {
  const navigate = useNavigate();
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get the current folder
  const currentFolder = folders.find(f => f.id === currentFolderId);
  
  // Auto-expand direct children of the current folder
  useEffect(() => {
    if (currentFolderId) {
      setExpandedFolders(prev => {
        // If current folder is not already expanded, add it
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
  const renderFolderTree = useCallback((parentId: string | null, depth = 0, maxIndent = 20) => {
    // Limit indentation to prevent horizontal overflow
    const indent = Math.min(depth * 16, maxIndent);
    
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
                style={{ marginLeft: `${indent}px` }}
              >
                {/* Use fixed-width container for folder toggle control */}
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
                
                {/* Count badge with fixed position */}
                {(folder.bookmarkCount !== undefined && folder.bookmarkCount > 0) && (
                  <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {folder.bookmarkCount}
                  </span>
                )}
              </div>
              
              {/* Render children if expanded */}
              {hasChildren && isExpanded && renderFolderTree(folder.id, depth + 1, maxIndent)}
            </div>
          );
        })}
      </div>
    );
  }, [filteredFolders, expandedFolders, currentFolderId, handleFolderSelect, toggleFolder, shouldHighlight]);
  
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
      
      <div className="border border-border/40 rounded-md p-3 bg-background/50">
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
    </div>
  );
};

export default SubFolderView;