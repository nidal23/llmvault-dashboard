import BookmarkList from "@/components/bookmarks/BookmarkList";
import FolderTree from "@/components/folders/FolderTree";
import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBookmarksStore } from "@/lib/stores/useBookmarksStore";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useFoldersStore } from "@/lib/stores/useFoldersStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Bookmarks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const folderParam = query.get('folder');
  const { user } = useAuth();
  
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderParam);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const [urlUpdateNeeded, setUrlUpdateNeeded] = useState<boolean>(false);
  
  // Add state for collapsible folder panel
  const [folderPanelExpanded, setFolderPanelExpanded] = useState(true);

  const { 
    folders, 
    isLoading: isLoadingFolders,
    error: foldersError,
    fetchFolders
  } = useFoldersStore();
  
  const { 
    bookmarks, 
    isLoading: isLoadingBookmarks,
    error: bookmarksError,
    updateFilters,
    fetchBookmarks,
    lastFetchTime
  } = useBookmarksStore();

  // Initial load of folders
  useEffect(() => {
    if (user) {
      fetchFolders(user.id);
    }
  }, [user, fetchFolders]);

  // Update selected folder name whenever folders or selected folder changes
  useEffect(() => {
    if (selectedFolder && folders.length > 0) {
      const folder = folders.find(f => f.id === selectedFolder);
      setSelectedFolderName(folder?.name || null);
    } else {
      setSelectedFolderName(null);
    }
  }, [selectedFolder, folders]);

  // Initial load of bookmarks
  useEffect(() => {
    if (user && selectedFolder !== undefined) {
      fetchBookmarks(user.id, {
        folderId: selectedFolder || undefined
      });
    }
  }, [user, selectedFolder, fetchBookmarks]);

  // Update selected folder state when URL parameter changes
  // But ONLY when the URL actually changes from external sources (like direct navigation)
  useEffect(() => {
    const currentFolderParam = query.get('folder');
    // Only update state if URL folder is different from our state AND we haven't flagged a pending URL update
    if (currentFolderParam !== selectedFolder && !urlUpdateNeeded) {
      setSelectedFolder(currentFolderParam);
      
      // Update bookmarks filter when folder changes
      if (user) {
        updateFilters({ folderId: currentFolderParam || undefined });
        fetchBookmarks(user.id, { folderId: currentFolderParam || undefined });
      }
    }
    
    // Reset the URL update flag if we've done the update
    if (urlUpdateNeeded && (
      (currentFolderParam === selectedFolder) || 
      (!currentFolderParam && !selectedFolder)
    )) {
      setUrlUpdateNeeded(false);
    }
  }, [location, folderParam, query, selectedFolder, user, updateFilters, fetchBookmarks, urlUpdateNeeded]);
  
  // Refresh folders data when bookmarks change
  useEffect(() => {
    if (user && lastFetchTime > 0) {
      fetchFolders(user.id);
    }
  }, [lastFetchTime, user, fetchFolders]);
  
  // Update URL when selected folder changes via user interaction (NOT from URL change)
  useEffect(() => {
    // Only update if we've flagged that a URL update is needed
    if (urlUpdateNeeded) {
      if (selectedFolder) {
        navigate(`?folder=${selectedFolder}`, { replace: true });
      } else {
        navigate('', { replace: true });
      }
    }
  }, [selectedFolder, navigate, urlUpdateNeeded]);
  
  // Handler for folder selection from either sidebar or folder tree
  const handleFolderSelect = useCallback((folderId: string) => {
    // Set the selected folder
    setSelectedFolder(folderId);
    
    // Update the filter in the store
    updateFilters({ folderId });
    
    // Fetch bookmarks for the selected folder
    if (user) {
      fetchBookmarks(user.id, { folderId });
    }
    
    // Flag that we need to update the URL (will be handled by the effect)
    setUrlUpdateNeeded(true);
    
    // On small screens, auto-collapse the folder panel after selection
    if (window.innerWidth < 1024) {
      setFolderPanelExpanded(false);
    }
  }, [updateFilters, fetchBookmarks, user]);
  
  // Toggle folder panel expansion
  const toggleFolderPanel = () => {
    setFolderPanelExpanded(!folderPanelExpanded);
  };
  
  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Breadcrumb navigation and folder toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">
              {selectedFolderName ? selectedFolderName : "All Conversations"}
            </h1>
          </div>
          
          {/* Responsive toggle button for folder panel */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleFolderPanel}
            className="lg:hidden"
            aria-label={folderPanelExpanded ? "Hide folders" : "Show folders"}
          >
            Folders {folderPanelExpanded ? <ChevronLeft className="ml-1 h-4 w-4" /> : <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
        
        {/* Main content area with flexible layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Folder panel - collapsible on mobile, fixed width on desktop */}
          <div 
            className={cn(
              "transition-all duration-300 ease-in-out border-r border-border overflow-y-auto",
              folderPanelExpanded ? "w-full lg:w-80 xl:w-96" : "w-0 lg:w-14 opacity-0 lg:opacity-100",
              "lg:flex flex-col",
              folderPanelExpanded ? "flex" : "hidden lg:flex"
            )}
          >
            <div className={cn(
              "p-4 h-full transition-opacity duration-300",
              folderPanelExpanded ? "opacity-100" : "opacity-0 lg:opacity-100"
            )}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">
                  Folders
                </h2>
                {/* Desktop toggle for folder panel */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex"
                  onClick={toggleFolderPanel}
                  aria-label={folderPanelExpanded ? "Collapse folders" : "Expand folders"}
                >
                  {folderPanelExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
              
              {isLoadingFolders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading folders...</span>
                </div>
              ) : foldersError ? (
                <div className="text-center py-8 text-red-500">
                  <p>Error loading folders</p>
                </div>
              ) : folders.length > 0 ? (
                <FolderTree 
                  folders={folders} 
                  selectedFolder={selectedFolder || undefined}
                  onFolderSelect={handleFolderSelect}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No folders yet</p>
                </div>
              )}
            </div>
            
            {/* Collapsed state toggle button (desktop only) */}
            {!folderPanelExpanded && (
              <div className="hidden lg:flex h-full items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={toggleFolderPanel}
                  aria-label="Expand folders"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Bookmark content - takes remaining space */}
          <div className={cn(
            "flex-1 transition-all duration-300 p-2 sm:p-4 overflow-auto",
            folderPanelExpanded ? "lg:ml-0" : "lg:ml-0"
          )}>
            {isLoadingBookmarks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading conversations...</span>
              </div>
            ) : bookmarksError ? (
              <div className="flex items-center justify-center py-8 text-red-500">
                <p>Error loading conversations</p>
              </div>
            ) : (
              <BookmarkList 
                bookmarks={bookmarks} 
                folderId={selectedFolder || undefined}
                folderName={selectedFolderName || undefined}
                onBookmarksChange={() => {
                  // This ensures we refresh folder counts when a bookmark is created/updated/deleted
                  if (user) {
                    fetchFolders(user.id);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Bookmarks;