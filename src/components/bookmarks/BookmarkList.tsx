import { useState, useEffect } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  ArrowDownUp,
  Plus,
  Bookmark as BookmarkIcon,
  Tag,
  Loader2,
  X
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
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Json, BookmarkWithFolder } from '../../lib/supabase/database.types';
import { useFoldersStore } from '@/lib/stores/useFoldersStore';
import { useBookmarksStore } from '@/lib/stores/useBookmarksStore';
import { useUserSettingsStore } from '@/lib/stores/useUserSettingsStore';
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/hooks/useAuth";
import BookmarkCard from "./BookmarkCard";

interface BookmarkListProps {
  bookmarks: BookmarkWithFolder[];
  folderId?: string;
  folderName?: string;
  onBookmarksChange?: () => void; // Callback for when bookmarks are modified
}

const BookmarkList = ({ bookmarks, folderId, folderName, onBookmarksChange }: BookmarkListProps) => {
  const { folders } = useFoldersStore();
  const { createBookmark, fetchBookmarks, updateFilters } = useBookmarksStore();
  const { settings, fetchSettings } = useUserSettingsStore();
  const { user } = useAuth();
  
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterLabel, setFilterLabel] = useState("all");
  
  // New bookmark dialog state
  const [isNewBookmarkOpen, setIsNewBookmarkOpen] = useState(false);
  const [newBookmarkUrl, setNewBookmarkUrl] = useState("");
  const [newBookmarkTitle, setNewBookmarkTitle] = useState("");
  const [newBookmarkPlatform, setNewBookmarkPlatform] = useState("");
  const [isPlatformOpen, setIsPlatformOpen] = useState(false);
  const [newBookmarkLabel, setNewBookmarkLabel] = useState<string>("");
  const [isLabelOpen, setIsLabelOpen] = useState(false);
  const [newBookmarkNotes, setNewBookmarkNotes] = useState("");
  const [newBookmarkFolder, setNewBookmarkFolder] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Helper function to safely convert Json to string array
  const parseArrayFromJson = (json: Json | null): string[] => {
    if (!json) return [];
    
    if (Array.isArray(json)) {
      return json.filter(item => typeof item === 'string') as string[];
    }
    
    return [];
  };
  
  // Extract platforms and labels from user settings
  const availablePlatforms = settings ? parseArrayFromJson(settings.platforms) : ["ChatGPT", "Claude", "Deepseek", "Gemini"];
  const availableLabels = settings ? parseArrayFromJson(settings.default_labels) : [];
  
  // Fetch user settings if they're not already loaded
  useEffect(() => {
    if (user && !settings) {
      fetchSettings(user.id);
    }
  }, [user, settings, fetchSettings]);
  
  // Initialize folder selection when folders are available
  useEffect(() => {
    if (folders && folders.length > 0) {
      if (folderId && folders.some(f => f.id === folderId)) {
        setNewBookmarkFolder(folderId);
      } else {
        setNewBookmarkFolder(folders[0].id);
      }
    }
  }, [folders, folderId]);
  
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

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    
    // For global search, update the store filters and fetch
    if (searchTerm.length > 2) {
      updateFilters({ search: searchTerm });
      if (user) {
        fetchBookmarks(user.id, { 
          search: searchTerm,
          folderId: folderId || undefined
        });
      }
    }
    
    if (searchTerm.length === 0 && user) {
      updateFilters({ search: undefined });
      fetchBookmarks(user.id, { 
        search: undefined,
        folderId: folderId || undefined
      });
    }
  };
  
  const handleCreateBookmark = async () => {
    if (!user) {
      toast.error('You must be logged in to create bookmarks');
      return;
    }
    
    if (!newBookmarkUrl.trim() || !newBookmarkTitle.trim() || !newBookmarkFolder) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createBookmark(user.id, {
        folder_id: newBookmarkFolder,
        url: newBookmarkUrl,
        title: newBookmarkTitle,
        platform: newBookmarkPlatform || null,
        label: newBookmarkLabel || null,
        notes: newBookmarkNotes || null
      });
      
      // Clear form and close dialog
      setNewBookmarkUrl("");
      setNewBookmarkTitle("");
      setNewBookmarkPlatform("");
      setNewBookmarkLabel("");
      setNewBookmarkNotes("");
      setIsNewBookmarkOpen(false);
      
      // Notify parent component about the change
      if (onBookmarksChange) {
        onBookmarksChange();
      }
    } catch (error) {
      console.log('error: ', error);
      // Error is handled in the store
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare to open the dialog
  const openNewBookmarkDialog = () => {
    if (folders && folders.length > 0) {
      // Set a default folder if one isn't already set
      if (!newBookmarkFolder) {
        if (folderId && folders.some(f => f.id === folderId)) {
          setNewBookmarkFolder(folderId);
        } else {
          setNewBookmarkFolder(folders[0].id);
        }
      }
      setIsNewBookmarkOpen(true);
    } else {
      toast.error('You need to create a folder first');
    }
  };
  
  return (
    <div className="w-full animate-fade-in">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {folderName || "All Conversations"}
          </h2>
          <Button 
            className="apple-button" 
            onClick={openNewBookmarkDialog}
          >
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
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 focus-visible:ring-1 dark:border-gray-700 dark:bg-gray-800/50"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-32 dark:border-gray-700 dark:bg-gray-800/50">
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
              <SelectTrigger className="w-32 dark:border-gray-700 dark:bg-gray-800/50">
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
                <Button variant="outline" size="icon" className="dark:border-gray-700 dark:bg-gray-800/50">
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
            onClick={openNewBookmarkDialog}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Bookmark
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedBookmarks.map((bookmark) => (
            <div key={bookmark.id} className="animate-scale-in">
              <BookmarkCard 
                bookmark={bookmark} 
                onBookmarkChange={onBookmarksChange} // Pass down the change handler
              />
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
                className="col-span-3 dark:border-gray-700 dark:bg-gray-800/50"
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
                className="col-span-3 dark:border-gray-700 dark:bg-gray-800/50"
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
                <SelectTrigger id="folder" className="col-span-3 dark:border-gray-700 dark:bg-gray-800/50">
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {folders && folders.length > 0 ? (
                    folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-folder">No folders available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="platform" className="text-right">
                Platform
              </Label>
              <div className="col-span-3">
                <Popover open={isPlatformOpen} onOpenChange={setIsPlatformOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isPlatformOpen}
                      className="w-full justify-between dark:border-gray-700 dark:bg-gray-800/50"
                    >
                      {newBookmarkPlatform
                        ? newBookmarkPlatform
                        : "Select platform..."}
                      {newBookmarkPlatform && (
                        <X
                          className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewBookmarkPlatform("");
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-full min-w-[220px]" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search or enter new platform..."
                        value={newBookmarkPlatform}
                        onValueChange={setNewBookmarkPlatform}
                        className="h-9"
                      />
                      <CommandEmpty>
                        {newBookmarkPlatform ? (
                          <div className="px-2 py-1.5 text-sm">
                            Press Enter to add "{newBookmarkPlatform}"
                          </div>
                        ) : (
                          <div className="px-2 py-1.5 text-sm">No platforms found</div>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {availablePlatforms.map((platform) => (
                          <CommandItem
                            key={platform}
                            value={platform}
                            onSelect={() => {
                              setNewBookmarkPlatform(platform);
                              setIsPlatformOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            {platform}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">
                Label
              </Label>
              <div className="col-span-3">
                <Popover open={isLabelOpen} onOpenChange={setIsLabelOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isLabelOpen}
                      className="w-full justify-between dark:border-gray-700 dark:bg-gray-800/50"
                    >
                      {newBookmarkLabel
                        ? newBookmarkLabel
                        : "Select or enter label..."}
                      {newBookmarkLabel && (
                        <X
                          className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewBookmarkLabel("");
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-full min-w-[220px]" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search or enter new label..."
                        value={newBookmarkLabel}
                        onValueChange={setNewBookmarkLabel}
                        className="h-9"
                      />
                      <CommandEmpty>
                        {newBookmarkLabel ? (
                          <div className="px-2 py-1.5 text-sm">
                            Press Enter to add "{newBookmarkLabel}"
                          </div>
                        ) : (
                          <div className="px-2 py-1.5 text-sm">No labels found</div>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {availableLabels.length > 0 ? (
                          availableLabels.map((label) => (
                            <CommandItem
                              key={label}
                              value={label}
                              onSelect={() => {
                                setNewBookmarkLabel(label);
                                setIsLabelOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              {label}
                            </CommandItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No saved labels. Type to create one.
                          </div>
                        )}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                placeholder="Add notes about this bookmark"
                className="col-span-3 dark:border-gray-700 dark:bg-gray-800/50"
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