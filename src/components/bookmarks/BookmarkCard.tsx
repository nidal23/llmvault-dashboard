import { useState, useEffect, CSSProperties } from "react";
import { 
  Copy, 
  ExternalLink, 
  MoreVertical, 
  Pencil, 
  Tag, 
  Trash,
  MessageSquare,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
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
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { BookmarkWithFolder, safeParsePlatforms } from '@/lib/supabase/database.types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBookmarksStore } from '@/lib/stores/useBookmarksStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserSettingsStore } from '@/lib/stores/useUserSettingsStore';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useFoldersStore } from '@/lib/stores/useFoldersStore';

interface BookmarkCardProps {
  bookmark: BookmarkWithFolder;
  onBookmarkChange?: () => void; // Callback for when bookmark is modified
}

const BookmarkCard = ({ bookmark, onBookmarkChange }: BookmarkCardProps) => {
  const { user } = useAuth();
  // Use our zustand stores
  const { deleteBookmark, updateBookmark } = useBookmarksStore();
  const { folders } = useFoldersStore();
  const { settings } = useUserSettingsStore();
  
  // State for dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState(bookmark.title);
  const [editUrl, setEditUrl] = useState(bookmark.url);
  const [editFolder, setEditFolder] = useState(bookmark.folder_id);
  const [editPlatform, setEditPlatform] = useState(bookmark.platform || "");
  const [editLabel, setEditLabel] = useState(bookmark.label || "");
  const [editNotes, setEditNotes] = useState(bookmark.notes || "");
  
  // Reset edit form when bookmark changes
  useEffect(() => {
    setEditTitle(bookmark.title);
    setEditUrl(bookmark.url);
    setEditFolder(bookmark.folder_id);
    setEditPlatform(bookmark.platform || "");
    setEditLabel(bookmark.label || "");
    setEditNotes(bookmark.notes || "");
  }, [bookmark]);
  
  // Function to find platform color from settings
  const getPlatformColor = (platformName: string | null): string => {
    if (!platformName) return "#808080";
    
    // Default platform colors as fallback
    const defaultColors: Record<string, string> = {
      "chatgpt": "#10A37F",
      "claude": "#8C5AF2",
      "deepseek": "#0066FF", 
      "gemini": "#AA5A44",
      "perplexity": "#61C7FA"
    };

    // Parse platforms from settings
    const platforms = settings?.platforms 
      ? safeParsePlatforms(settings.platforms) 
      : [];
    
    // Try to find the platform in user settings
    const platform = platforms.find(p => 
      p.name.toLowerCase() === platformName.toLowerCase()
    );
    
    if (platform && platform.color) {
      return platform.color;
    }
    
    // Fallback to default colors if available
    const lowerPlatform = platformName.toLowerCase();
    if (defaultColors[lowerPlatform]) {
      return defaultColors[lowerPlatform];
    }
    
    // Default gray if no color is found
    return "#808080";
  };
  
  // Get the style for the platform badge
  const getPlatformBadgeStyle = (platformName: string | null): CSSProperties => {
    if (!platformName) return {};
    
    const color = getPlatformColor(platformName);
    
    // Extract RGB components for background
    let r = 128, g = 128, b = 128;
    
    try {
      if (color.startsWith('#') && (color.length === 4 || color.length === 7)) {
        if (color.length === 4) {
          // Convert #RGB to #RRGGBB
          const r1 = color[1], g1 = color[2], b1 = color[3];
          r = parseInt(`${r1}${r1}`, 16);
          g = parseInt(`${g1}${g1}`, 16);
          b = parseInt(`${b1}${b1}`, 16);
        } else {
          r = parseInt(color.slice(1, 3), 16);
          g = parseInt(color.slice(3, 5), 16);
          b = parseInt(color.slice(5, 7), 16);
        }
      }
    } catch (error) {
      console.error('Error parsing color:', error);
    }
    
    // Create a semi-transparent background (20% opacity)
    const bgColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
    
    // For text, use the original color
    return {
      backgroundColor: bgColor,
      color: color,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.5)`, // Add a subtle border with 50% opacity
    };
  };
  
  // Get all available platforms for the dropdown
  const getAvailablePlatforms = () => {
    const platforms = settings?.platforms 
      ? safeParsePlatforms(settings.platforms) 
      : [];
    
    const platformNames = platforms.map(p => p.name);
    
    return platformNames.length > 0 
      ? platformNames 
      : ["ChatGPT", "Claude", "Deepseek", "Gemini", "Perplexity", "Other"];
  };
  
  const createdDate = bookmark.created_at ? new Date(bookmark.created_at) : new Date();
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookmark.url);
    toast.success("Link copied to clipboard!");
  };
  
  const handleDelete = async () => {
    if (!user) {
      toast.error('You must be logged in to delete conversations');
      return;
    }

    if (!bookmark?.id) {
      toast.error('Unable to delete conversations');
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteBookmark(user.id, bookmark.id);
      
      // Notify parent about changes
      if (onBookmarkChange) {
        onBookmarkChange();
      }
      
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.log('error : ', error);
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdate = async () => {
    if (!user) {
      toast.error('You must be logged in to update bookmarks');
      return;
    }
    
    if (!bookmark?.id) {
      toast.error('Unable to update bookmark');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateBookmark(user.id, bookmark.id, {
        title: editTitle,
        url: editUrl,
        folder_id: editFolder,
        platform: editPlatform || null,
        label: editLabel || null,
        notes: editNotes || null
      });
      
      // Notify parent about changes
      if (onBookmarkChange) {
        onBookmarkChange();
      }
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.log('error: ', error);
      // Error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Open edit dialog and ensure form state is updated
  const openEditDialog = () => {
    setEditTitle(bookmark.title);
    setEditUrl(bookmark.url);
    setEditFolder(bookmark.folder_id);
    setEditPlatform(bookmark.platform || "");
    setEditLabel(bookmark.label || "");
    setEditNotes(bookmark.notes || "");
    setIsEditDialogOpen(true);
  };
  
  return (
    <>
      <div className="group apple-card overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 mr-2">
              <div className="flex items-center gap-2 mb-1">
                {bookmark.platform && (
                  <Badge 
                    variant="outline" 
                    className="border-0 flex items-center"
                    style={getPlatformBadgeStyle(bookmark.platform)}
                  >
                    <span 
                      className="h-2 w-2 rounded-full mr-1" 
                      style={{ 
                        backgroundColor: getPlatformColor(bookmark.platform) 
                      }}
                    />
                    <span>{bookmark.platform}</span>
                  </Badge>
                )}
                {bookmark.label && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span>{bookmark.label}</span>
                  </Badge>
                )}
              </div>
              <h3 className="font-medium text-lg truncate">{bookmark.title}</h3>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card w-48">
                <DropdownMenuItem onClick={() => window.open(bookmark.url, "_blank")}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>Open Chat</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copy Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openEditDialog}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {bookmark.notes && (
            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
              {bookmark.notes}
            </p>
          )}
          
          {bookmark.folder_name && (
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">
                Folder: {bookmark.folder_name}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center">
            <MessageSquare className="h-3 w-3 mr-1" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <time dateTime={createdDate.toISOString()}>{timeAgo}</time>
                </TooltipTrigger>
                <TooltipContent>
                  {format(createdDate, "PPpp")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full hover:bg-muted"
              onClick={handleCopyLink}
            >
              <Copy className="h-3 w-3" />
              <span className="sr-only">Copy link</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full hover:bg-muted"
              onClick={() => window.open(bookmark.url, "_blank")}
            >
              <ExternalLink className="h-3 w-3" />
              <span className="sr-only">Open chat</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Delete Bookmark</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bookmark? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isSubmitting}
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
      
      {/* Edit dialog with platform color selection */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
            <DialogDescription>
              Update your bookmark information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                Title
              </Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-url" className="text-right">
                URL
              </Label>
              <Input
                id="edit-url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-folder" className="text-right">
                Folder
              </Label>
              <div className="col-span-3">
                <select 
                  id="edit-folder"
                  value={editFolder}
                  onChange={(e) => setEditFolder(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                >
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-platform" className="text-right">
                Platform
              </Label>
              <div className="col-span-3">
                <select 
                  id="edit-platform"
                  value={editPlatform}
                  onChange={(e) => setEditPlatform(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                >
                  <option value="">None</option>
                  {getAvailablePlatforms().map(platform => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
                
                {editPlatform && (
                  <div className="mt-2 flex items-center">
                    <span className="text-xs text-muted-foreground mr-2">Platform color:</span>
                    <div 
                      className="h-4 w-4 rounded-full inline-block mr-2"
                      style={{ 
                        backgroundColor: getPlatformColor(editPlatform) 
                      }}
                    ></div>
                    <span className="text-xs">{getPlatformColor(editPlatform)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-label" className="text-right">
                Label
              </Label>
              <Input
                id="edit-label"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Optional label"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-notes" className="text-right">
                Notes
              </Label>
              <Input
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes"
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookmarkCard;