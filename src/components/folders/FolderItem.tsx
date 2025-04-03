import { FolderTree as FolderIcon, ChevronRight, ChevronDown, MoreVertical, Edit, Trash, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderWithCount } from "@/lib/supabase/database.types";

interface FolderItemProps {
  folder: FolderWithCount;
  depth: number;
  hasChildren: boolean;
  canShowChildren: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  isBeingDragged: boolean;
  isDropTarget: boolean;
  onToggleExpand: (folderId: string, e: React.MouseEvent) => void;
  onFolderSelect: (folderId: string) => void;
  onEditFolder: (folder: FolderWithCount) => void;
  onNewSubfolder: (parentId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDragStart: (e: React.DragEvent, folderId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, folderId: string) => void;
  onDrop: (e: React.DragEvent, folderId: string) => void;
  renderChildren: (parentId: string, depth: number) => React.ReactNode;
}

const FolderItem = ({
  folder,
  depth,
  hasChildren,
  canShowChildren,
  isExpanded,
  isSelected,
  isBeingDragged,
  isDropTarget,
  onToggleExpand,
  onFolderSelect,
  onEditFolder,
  onNewSubfolder,
  onDeleteFolder,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  renderChildren
}: FolderItemProps) => {
  return (
    <div 
      className="group"
      draggable
      onDragStart={(e) => onDragStart(e, folder.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, folder.id)}
      onDrop={(e) => onDrop(e, folder.id)}
    >
      <div 
        className={cn(
          "flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer text-sm group/item",
          isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
          isDropTarget && "bg-accent/70 outline outline-1 outline-primary",
          isBeingDragged && "opacity-50",
          depth > 0 && "ml-4"
        )}
        onClick={() => onFolderSelect(folder.id)}
      >
        <div className="flex items-center min-w-0">
          {hasChildren && canShowChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 mr-1 p-0"
              onClick={(e) => onToggleExpand(folder.id, e)}
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
              }}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card w-40">
            <DropdownMenuItem
              onClick={() => {
                onEditFolder(folder);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onNewSubfolder(folder.id);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>New Subfolder</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onDeleteFolder(folder.id);
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
          {renderChildren(folder.id, depth + 1)}
        </div>
      )}
    </div>
  );
};

export default FolderItem;