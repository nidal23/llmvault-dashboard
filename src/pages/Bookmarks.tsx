import BookmarkList from "@/components/bookmarks/BookmarkList";
import FolderTree from "@/components/folders/FolderTree";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBookmarksStore } from "@/lib/stores/useBookmarksStore";
import { Loader2 } from "lucide-react";
import { useFoldersStore } from "@/lib/stores/useFoldersStore";

const Bookmarks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const folderParam = query.get('folder');
  const { user } = useAuth();
  
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderParam);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const [urlUpdateNeeded, setUrlUpdateNeeded] = useState<boolean>(false);

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
  }, [updateFilters, fetchBookmarks, user]);
  
  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Folders</CardTitle>
              <CardDescription>
                {selectedFolderName 
                  ? `Viewing ${selectedFolderName}`
                  : "Browse your organized folders"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFolders ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">Loading folders...</span>
                </div>
              ) : foldersError ? (
                <div className="text-center py-4 text-red-500">
                  <p className="text-sm">Error loading folders</p>
                </div>
              ) : folders.length > 0 ? (
                <FolderTree 
                  folders={folders} 
                  selectedFolder={selectedFolder || undefined}
                  onFolderSelect={handleFolderSelect}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No folders yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          {isLoadingBookmarks ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Loading bookmarks...</span>
            </div>
          ) : bookmarksError ? (
            <div className="flex items-center justify-center py-4 text-red-500">
              <p>Error loading bookmarks</p>
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
    </Layout>
  );
};

export default Bookmarks;