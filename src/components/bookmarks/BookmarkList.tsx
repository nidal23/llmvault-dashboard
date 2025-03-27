import { useState } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  ArrowDownUp,
  Plus,
  Bookmark as BookmarkIcon,
  Tag,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import BookmarkCard from "./BookmarkCard";
import { Badge } from "@/components/ui/badge";
import { BookmarkWithFolder } from '../../lib/supabase/database.types';
import { useAuth } from '@/lib/context/AuthContext';
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { useFolders } from '@/lib/hooks/useFolders';
import { toast } from "react-hot-toast";


interface BookmarkListProps {
  bookmarks: BookmarkWithFolder[];
  folderId?: string;
  folderName?: string;
}

const BookmarkList = ({ bookmarks, folderId, folderName }: BookmarkListProps) => {
  const { user } = useAuth();
  const { folders } = useFolders();
  const { createBookmark } = useBookmarks();
  
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterLabel, setFilterLabel] = useState("all");
  
  // New bookmark dialog state
  const [isNewBookmarkOpen, setIsNewBookmarkOpen] = useState(false);
  const [newBookmarkUrl, setNewBookmarkUrl] = useState("");
  const [newBookmarkTitle, setNewBookmarkTitle] = useState("");
  const [newBookmarkPlatform, setNewBookmarkPlatform] = useState("");
  const [newBookmarkLabel, setNewBookmarkLabel] = useState<string | null>(null);
  const [newBookmarkNotes, setNewBookmarkNotes] = useState("");
  const [newBookmarkFolder, setNewBookmarkFolder] = useState(folderId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get unique platforms and labels for filters
  const platforms = ["all", ...new Set(bookmarks.map(b => b.platform).filter(Boolean))];
  const labels = ["all", ...new Set(bookmarks.filter(b => b.label).map(b => b.label as string))];
  
  // Filter bookmarks based on search, platform, and label
  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = 
      bookmark.title.toLowerCase().includes(search.toLowerCase()) ||
      (bookmark.notes?.toLowerCase().includes(search.toLowerCase()) ?? false);
    
    const matchesPlatform = filterPlatform === "all" || bookmark.platform === filterPlatform;
    const matchesLabel = filterLabel === "all" || bookmark.label === filterLabel;
    
    return matchesSearch && matchesPlatform && matchesLabel;
  });
  
  // Sort bookmarks
  const sortedBookmarks = [...filteredBookmarks].sort((a, b) => {
    switch (sortBy) {
      case "newest": {
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        return dateB - dateA;
      }
      case "oldest": {
        const olderDateA = a.created_at ? new Date(a.created_at).getTime() : Infinity;
        const olderDateB = b.created_at ? new Date(b.created_at).getTime() : Infinity;
        return olderDateA - olderDateB;
      }
      case "alphabetical":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
  
  const handleCreateBookmark = async () => {
    if (!user) {
      toast.error('You must be signed in to create bookmarks');
      return;
    }
    
    if (!newBookmarkUrl.trim() || !newBookmarkTitle.trim() || !newBookmarkFolder) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createBookmark({
        folder_id: newBookmarkFolder,
        url: newBookmarkUrl,
        title: newBookmarkTitle,
        platform: newBookmarkPlatform || null,
        label: newBookmarkLabel,
        notes: newBookmarkNotes || null
      });
      
      // Clear form and close dialog
      setNewBookmarkUrl("");
      setNewBookmarkTitle("");
      setNewBookmarkPlatform("");
      setNewBookmarkLabel(null);
      setNewBookmarkNotes("");
      setIsNewBookmarkOpen(false);
    } catch (error) {
      console.log('error: ', error)
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="w-full animate-fade-in">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {folderName || "All Bookmarks"}
          </h2>
          <Button className="apple-button" onClick={() => setIsNewBookmarkOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Bookmark
          </Button>
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search bookmarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 focus-visible:ring-1"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map(platform => {
                  if (platform === null) return null;
                  return (
                    <SelectItem key={platform} value={platform}>
                      {platform === "all" ? "All Platforms" : platform}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            <Select value={filterLabel} onValueChange={setFilterLabel}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Label" />
              </SelectTrigger>
              <SelectContent>
                {labels.map(label => (
                  <SelectItem key={label} value={label}>
                    {label === "all" ? "All Labels" : label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <ArrowDownUp className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card">
                <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                  <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="alphabetical">Alphabetical</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BookmarkIcon className="h-4 w-4" />
            <span>{sortedBookmarks.length} bookmarks</span>
          </div>
          
          {filterPlatform !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3 w-3" />
              <span>{filterPlatform}</span>
            </Badge>
          )}
          
          {filterLabel !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              <span>{filterLabel}</span>
            </Badge>
          )}
        </div>
      </div>
      
      {sortedBookmarks.length === 0 ? (
        <div className="mt-8 flex h-60 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-fade-in">
          <BookmarkIcon className="h-10 w-10 text-muted-foreground/60" />
          <h3 className="mt-4 text-lg font-semibold">No bookmarks found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {search ? "Try adjusting your search or filters" : "Get started by adding your first bookmark"}
          </p>
          <Button 
            className="mt-4" 
            variant="outline" 
            onClick={() => setIsNewBookmarkOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Bookmark
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedBookmarks.map((bookmark) => (
            <div key={bookmark.id} className="animate-scale-in">
              <BookmarkCard bookmark={bookmark} />
            </div>
          ))}
        </div>
      )}
      
      {/* Add Bookmark Dialog */}
      <Dialog open={isNewBookmarkOpen} onOpenChange={setIsNewBookmarkOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Add New Bookmark</DialogTitle>
            <DialogDescription>
              Add a new bookmark to your collection.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL *
              </Label>
              <Input
                id="url"
                placeholder="https://chat.openai.com/..."
                className="col-span-3"
                value={newBookmarkUrl}
                onChange={(e) => setNewBookmarkUrl(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title *
              </Label>
              <Input
                id="title"
                placeholder="My ChatGPT Conversation"
                className="col-span-3"
                value={newBookmarkTitle}
                onChange={(e) => setNewBookmarkTitle(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folder" className="text-right">
                Folder *
              </Label>
              <Select 
                value={newBookmarkFolder} 
                onValueChange={setNewBookmarkFolder}
              >
                <SelectTrigger id="folder" className="col-span-3">
                  <SelectValue placeholder="Select a folder" />
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
              <Label htmlFor="platform" className="text-right">
                Platform
              </Label>
              <Select 
                value={newBookmarkPlatform} 
                onValueChange={setNewBookmarkPlatform}
              >
                <SelectTrigger id="platform" className="col-span-3">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ChatGPT">ChatGPT</SelectItem>
                  <SelectItem value="Claude">Claude</SelectItem>
                  <SelectItem value="Gemini">Gemini</SelectItem>
                  <SelectItem value="Deepseek">Deepseek</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">
                Label
              </Label>
              <Select 
                value={newBookmarkLabel || ""} 
                onValueChange={(value) => setNewBookmarkLabel(value || null)}
              >
                <SelectTrigger id="label" className="col-span-3">
                  <SelectValue placeholder="Add a label" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {labels.filter(l => l !== "all").map(label => (
                    <SelectItem key={label} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                placeholder="Add notes about this bookmark"
                className="col-span-3"
                value={newBookmarkNotes}
                onChange={(e) => setNewBookmarkNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleCreateBookmark}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : 'Create Bookmark'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookmarkList;