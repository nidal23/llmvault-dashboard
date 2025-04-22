import { useState, useMemo } from "react";
import { Check, ChevronDown, FolderTree, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FolderWithCount } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

/**
 * Create a hierarchical representation of folders for better display
 */
// interface HierarchicalFolder extends FolderWithCount {
//   level: number;
//   path: string; // Store full path for display
// }

interface HierarchicalFolderSelectorProps {
  folders: FolderWithCount[];
  selectedFolderId: string;
  onSelect: (folderId: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * A reusable component for selecting folders with hierarchical display
 */
const HierarchicalFolderSelector = ({
  folders,
  selectedFolderId,
  onSelect,
  className,
  placeholder = "Select a folder"
}: HierarchicalFolderSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get selected folder name or path
  const selectedFolderName = useMemo(() => {
    const folder = folders.find(f => f.id === selectedFolderId);
    return folder ? folder.name : placeholder;
  }, [selectedFolderId, folders, placeholder]);

  // Process folders into a hierarchical structure with paths
  const processedFolders = useMemo(() => {
    // First, build a map of folder IDs to their names for quick lookup
    const folderMap = new Map<string, FolderWithCount>();
    folders.forEach(folder => folderMap.set(folder.id, folder));

    // Helper function to get the full path of a folder
    const getFullPath = (folderId: string): string => {
      const paths: string[] = [];
      let currentId = folderId;
      
      // Prevent infinite loops with a reasonable limit (max 20 levels deep)
      let maxDepth = 20;
      
      while (currentId && maxDepth > 0) {
        const folder = folderMap.get(currentId);
        if (!folder) break;
        
        paths.unshift(folder.name);
        currentId = folder.parent_id || "";
        maxDepth--;
      }
      
      return paths.join(" / ");
    };

    // Helper function to determine the nesting level of a folder
    const getFolderLevel = (folderId: string): number => {
      let level = 0;
      let currentId = folderId;
      
      // Prevent infinite loops with a reasonable limit
      let maxDepth = 20;
      
      while (currentId && maxDepth > 0) {
        const folder = folderMap.get(currentId);
        if (!folder || !folder.parent_id) break;
        
        level++;
        currentId = folder.parent_id;
        maxDepth--;
      }
      
      return level;
    };

    // Create hierarchical folders with level and path information
    return folders.map(folder => ({
      ...folder,
      level: getFolderLevel(folder.id),
      path: getFullPath(folder.id)
    }));
  }, [folders]);

  // Filter folders based on search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery) return processedFolders;
    
    return processedFolders.filter(folder => 
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folder.path.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [processedFolders, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center overflow-hidden">
            <FolderTree className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
            <span className="truncate">{selectedFolderName}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Search folders..." 
              className="h-9 flex-1 border-0 outline-none focus:ring-0"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>
          <CommandList className="max-h-[300px] overflow-auto">
            <CommandEmpty>No folders found</CommandEmpty>
            <CommandGroup>
              {filteredFolders.map((folder) => (
                <CommandItem
                  key={folder.id}
                  value={folder.id}
                  onSelect={() => {
                    onSelect(folder.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center w-full">
                    <div 
                      className="flex-shrink-0" 
                      style={{ 
                        width: `${folder.level * 12 + 20}px`,
                        paddingLeft: `${folder.level * 12}px` 
                      }}
                    >
                      {folder.id === selectedFolderId ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <FolderTree className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="truncate">{folder.name}</span>
                    {folder.bookmarkCount !== undefined && folder.bookmarkCount > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {folder.bookmarkCount}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default HierarchicalFolderSelector;