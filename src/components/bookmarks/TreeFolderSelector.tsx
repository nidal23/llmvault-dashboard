import { useState, useMemo, useCallback } from "react";
import { Check, ChevronDown, ChevronRight, FolderTree, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FolderWithCount } from "@/lib/supabase/database.types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TreeFolderSelectorProps {
  folders: FolderWithCount[];
  selectedFolderId: string;
  onSelect: (folderId: string) => void;
  className?: string;
  placeholder?: string;
}

// Define a type for our hierarchical folder structure
interface FolderTreeNode extends FolderWithCount {
  children: FolderTreeNode[];
}

/**
 * A folder selector component that displays folders in an expandable tree view
 */
const TreeFolderSelector = ({
  folders,
  selectedFolderId,
  onSelect,
  className,
  placeholder = "Select a folder"
}: TreeFolderSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  // Get selected folder name
  const selectedFolder = useMemo(() => 
    folders.find(f => f.id === selectedFolderId), 
    [folders, selectedFolderId]
  );

  // Organize folders into a tree structure
  const folderTree = useMemo(() => {
    // First, build a map of folder IDs to their data
    const folderMap = new Map<string, FolderWithCount>();
    folders.forEach(folder => folderMap.set(folder.id, folder));

    // Function to organize folders into a hierarchical structure
    const buildFolderTree = (parentId: string | null): FolderTreeNode[] => {
      return folders
        .filter(folder => folder.parent_id === parentId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(folder => ({
          ...folder,
          children: buildFolderTree(folder.id)
        }));
    };

    return buildFolderTree(null);
  }, [folders]);

  // Filter folders based on search query if provided
  const filteredFolderTree = useMemo(() => {
    if (!searchQuery.trim()) return folderTree;

    // Helper function to check if a folder or any of its descendants match
    const folderOrDescendantsMatch = (folder: FolderTreeNode): boolean => {
      const nameMatches = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // If this folder matches, return true immediately
      if (nameMatches) return true;
      
      // Check children (if any)
      if (folder.children && folder.children.length > 0) {
        return folder.children.some(child => folderOrDescendantsMatch(child));
      }
      
      return false;
    };

    // Filter the folder tree
    const filterTree = (tree: FolderTreeNode[]): FolderTreeNode[] => {
      return tree
        .filter(folder => folderOrDescendantsMatch(folder))
        .map(folder => ({
          ...folder,
          children: folder.children ? filterTree(folder.children) : []
        }));
    };

    return filterTree(folderTree);
  }, [folderTree, searchQuery]);

  // Toggle folder expansion state
  const toggleFolder = useCallback((folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId) 
        : [...prev, folderId]
    );
  }, []);

  // Recursive function to render the folder tree
  const renderFolderTree = useCallback((tree: FolderTreeNode[], level = 0) => {
    return tree.map(folder => {
      const hasChildren = folder.children && folder.children.length > 0;
      const isExpanded = expandedFolders.includes(folder.id);
      const isSelected = folder.id === selectedFolderId;

      return (
        <div key={folder.id} className="select-none">
          <div 
            className={cn(
              "flex items-center py-1 px-2 rounded-md text-sm cursor-pointer",
              isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent",
              "transition-colors"
            )}
            style={{ paddingLeft: `${(level * 16) + 8}px` }}
            onClick={() => {
              onSelect(folder.id);
              // Keep dropdown open after selection
            }}
          >
            <div 
              className="mr-1 flex h-5 w-5 items-center justify-center"
              onClick={(e) => hasChildren ? toggleFolder(folder.id, e) : null}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )
              ) : (
                <span className="w-4" />
              )}
            </div>
            <FolderTree className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
            <span className="truncate flex-1">{folder.name}</span>
            {folder.bookmarkCount !== undefined && folder.bookmarkCount > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {folder.bookmarkCount}
              </span>
            )}
            {isSelected && (
              <Check className="ml-2 h-4 w-4 text-primary" />
            )}
          </div>
          
          {/* Render children if expanded */}
          {hasChildren && isExpanded && (
            <div className="ml-2">
              {renderFolderTree(folder.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  }, [expandedFolders, selectedFolderId, onSelect, toggleFolder]);

  // Auto-expand parent folders of the selected folder
  const expandSelectedFolderParents = useCallback(() => {
    if (!selectedFolderId) return;
    
    // Helper function to find parents of a folder
    const findParents = (folderId: string, parents: string[] = []): string[] => {
      const folder = folders.find(f => f.id === folderId);
      if (!folder || !folder.parent_id) return parents;
      
      return findParents(folder.parent_id, [...parents, folder.parent_id]);
    };
    
    const parentFolders = findParents(selectedFolderId);
    setExpandedFolders(prev => {
      const newExpanded = [...prev];
      parentFolders.forEach(id => {
        if (!newExpanded.includes(id)) {
          newExpanded.push(id);
        }
      });
      return newExpanded;
    });
  }, [selectedFolderId, folders]);

  // When dropdown opens, auto-expand parents
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      expandSelectedFolderParents();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center overflow-hidden">
            <FolderTree className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selectedFolder ? selectedFolder.name : placeholder}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="flex flex-col">
          {/* Search bar */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
            <Input
              placeholder="Search folders..." 
              className="h-8 flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Folder tree */}
          <ScrollArea className="h-[300px] max-h-[50vh]">
            <div className="p-2">
              {filteredFolderTree.length > 0 ? (
                renderFolderTree(filteredFolderTree)
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {searchQuery ? "No matching folders found" : "No folders available"}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TreeFolderSelector;