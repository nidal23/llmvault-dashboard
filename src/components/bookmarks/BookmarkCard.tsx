import { useState } from "react";
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
import { toast } from "sonner";
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
import { BookmarkWithFolder } from '../../lib/supabase/database.types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFolders } from "@/lib/hooks/useFolders";

interface BookmarkCardProps {
  bookmark: BookmarkWithFolder;
}

const getPlatformColor = (platform: string) => {
  switch (platform?.toLowerCase()) {
    case "chatgpt":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300";
    case "claude":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "deepseek":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "gemini":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

const BookmarkCard = ({ bookmark }: BookmarkCardProps) => {
  // Use our custom hooks
  const { deleteBookmark, updateBookmark } = useBookmarks();
  const { folders } = useFolders();
  
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
  
  const platformColor = getPlatformColor(bookmark.platform || '');
  const createdDate = bookmark.created_at ? new Date(bookmark.created_at) : new Date();
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookmark.url);
    toast.success("Link copied to clipboard!");
  };
  
  const handleDelete = async () => {
    if (!bookmark?.id) {
      toast.error('Unable to delete bookmark');
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteBookmark(bookmark.id);
      toast.success('Bookmark deleted successfully');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.log('error : ', error)
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdate = async () => {
    if (!bookmark?.id) {
      toast.error('Unable to update bookmark');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateBookmark(bookmark.id, {
        title: editTitle,
        url: editUrl,
        folder_id: editFolder,
        platform: editPlatform || null,
        label: editLabel || null,
        notes: editNotes || null
      });
      
      toast.success('Bookmark updated successfully');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.log('error: ', error)
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset edit form when opening dialog
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
                  <Badge variant="outline" className={`${platformColor} border-0`}>
                    {bookmark.platform}
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
      
      {/* Edit dialog */}
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
              <Select value={editFolder} onValueChange={setEditFolder}>
                <SelectTrigger id="edit-folder" className="col-span-3">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-platform" className="text-right">
                Platform
              </Label>
              <Select 
                value={editPlatform} 
                onValueChange={setEditPlatform}
              >
                <SelectTrigger id="edit-platform" className="col-span-3">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="ChatGPT">ChatGPT</SelectItem>
                  <SelectItem value="Claude">Claude</SelectItem>
                  <SelectItem value="Gemini">Gemini</SelectItem>
                  <SelectItem value="Deepseek">Deepseek</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
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