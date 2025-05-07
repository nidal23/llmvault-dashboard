import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  ArrowDownUp,
  Plus,
  Bookmark as BookmarkIcon,
  Tag,
  X,
  LayoutGrid,
  List
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
import { Badge } from "@/components/ui/badge";
import { BookmarkWithFolder, PlatformWithColor, safeParsePlatforms } from '../../lib/supabase/database.types';
import { useFoldersStore } from '@/lib/stores/useFoldersStore';
import { useBookmarksStore } from '@/lib/stores/useBookmarksStore';
import { useUserSettingsStore } from '@/lib/stores/useUserSettingsStore';
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/hooks/useAuth";
import BookmarkCard from "./BookmarkCard";
import { cn } from "@/lib/utils";
import AddBookmarkModal from './AddBookmarkModal';

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // New bookmark dialog state
  const [isNewBookmarkOpen, setIsNewBookmarkOpen] = useState(false);
  
  // Helper function to safely convert Json to string array
  const parseArrayFromJson = (json: any | null): string[] => {
    if (!json) return [];
    
    if (Array.isArray(json)) {
      return json.filter(item => typeof item === 'string') as string[];
    }
    
    return [];
  };
  
  // Extract platforms and labels from user settings
  const availablePlatforms = useMemo(() => {
    if (!settings?.platforms) {
      return [
        { name: "ChatGPT", color: "#10A37F" },
        { name: "Claude", color: "#8C5AF2" },
        { name: "Deepseek", color: "#0066FF" },
        { name: "Gemini", color: "#AA5A44" },
        { name: "Perplexity", color: "#61C7FA" }
      ] as PlatformWithColor[];
    }
    
    return safeParsePlatforms(settings.platforms);
  }, [settings?.platforms]);
  
  const availableLabels = useMemo(() => {
    if (!settings?.default_labels) return [];
    return parseArrayFromJson(settings.default_labels);
  }, [settings?.default_labels]);
  
  // Fetch user settings if they're not already loaded
  useEffect(() => {
    if (user && !settings) {
      fetchSettings(user.id);
    }
  }, [user, settings, fetchSettings]);
  
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
  
  const handleCreateBookmark = async (data: {
    url: string;
    title: string;
    folder_id: string;
    platform?: string | null;
    label?: string | null;
    notes?: string | null;
  }) => {
    if (!user) {
      toast.error('You must be logged in to add a conversation');
      return;
    }
    
    try {
      await createBookmark(user.id, data);
      
      // Close dialog and notify parent
      setIsNewBookmarkOpen(false);
      
      // Notify parent component about the change
      if (onBookmarksChange) {
        onBookmarksChange();
      }
      
      return Promise.resolve();
    } catch (error) {
      console.log('error: ', error);
      // Error is handled in the store
      return Promise.reject(error);
    }
  };

  // Prepare to open the dialog
  const openNewBookmarkDialog = () => {
    if (folders && folders.length > 0) {
      setIsNewBookmarkOpen(true);
    } else {
      toast.error('You need to create a folder first');
    }
  };
  
  // Toggle view mode between grid and list
  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };
  
  return (
    <div className="w-full animate-fade-in">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium sm:hidden">
            {/* This heading only shows on mobile since the main heading is in the parent component */}
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
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 focus-visible:ring-1 dark:border-gray-700 dark:bg-gray-800/50"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
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
            
            {/* View mode toggle */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleViewMode}
              className="dark:border-gray-700 dark:bg-gray-800/50"
            >
              {viewMode === "grid" ? (
                <List className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BookmarkIcon className="h-4 w-4" />
            <span>{sortedBookmarks.length} conversations</span>
          </div>
          
          {filterPlatform !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3 w-3" />
              <span>{filterPlatform}</span>
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => setFilterPlatform("all")}
              />
            </Badge>
          )}
          
          {filterLabel !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              <span>{filterLabel}</span>
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => setFilterLabel("all")}
              />
            </Badge>
          )}
        </div>
      </div>
      
      {sortedBookmarks.length === 0 ? (
        <div className="mt-8 flex h-60 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-fade-in">
          <BookmarkIcon className="h-10 w-10 text-muted-foreground/60" />
          <h3 className="mt-4 text-lg font-semibold">No conversations found</h3>
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
        <div className={cn(
          "mt-6",
          viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4" 
            : "flex flex-col gap-3"
        )}>
          {sortedBookmarks.map((bookmark) => (
            <div key={bookmark.id} className={cn(
              "animate-scale-in",
              viewMode === "list" && "max-w-none"
            )}>
              <BookmarkCard 
                bookmark={bookmark} 
                onBookmarkChange={onBookmarksChange}
                viewMode={viewMode}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Enhanced Add Bookmark Modal */}
      <AddBookmarkModal
        isOpen={isNewBookmarkOpen}
        onClose={() => setIsNewBookmarkOpen(false)}
        folders={folders}
        availablePlatforms={availablePlatforms}
        availableLabels={availableLabels}
        currentFolderId={folderId}
        onSubmit={handleCreateBookmark}
      />
    </div>
  );
};

export default BookmarkList;