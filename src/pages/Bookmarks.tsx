import BookmarkList from "@/components/bookmarks/BookmarkList";
import FolderTree from "@/components/folders/FolderTree";
import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBookmarksStore } from "@/lib/stores/useBookmarksStore";
import { Loader2 } from "lucide-react";
import { useFoldersStore } from '@/lib/stores/useFoldersStore';

const Bookmarks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const folderParam = query.get('folder');
  const { user } = useAuth();
  
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderParam);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);

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
  useEffect(() => {
    const currentFolderParam = query.get('folder');
    
    // Only update if folder parameter has changed
    if (currentFolderParam !== selectedFolder) {
      setSelectedFolder(currentFolderParam);
      
      // Update bookmarks filter when folder changes
      if (user) {
        updateFilters({ folderId: currentFolderParam || undefined });
        fetchBookmarks(user.id, { folderId: currentFolderParam || undefined });
      }
    }
  }, [location, query, selectedFolder, user, updateFilters, fetchBookmarks]);
  
  // Refresh folders data when bookmarks change
  useEffect(() => {
    if (user && lastFetchTime > 0) {
      fetchFolders(user.id);
    }
  }, [lastFetchTime, user, fetchFolders]);
  
  // Handler for folder selection from folder tree
  const handleFolderSelect = useCallback((folderId: string) => {
    // Set the selected folder
    setSelectedFolder(folderId);
    
    // Update the filter in the store
    updateFilters({ folderId });
    
    // Fetch bookmarks for the selected folder
    if (user) {
      fetchBookmarks(user.id, { folderId });
    }
    
    // Update URL (let's keep it simple - pagination will be handled by BookmarkList)
    navigate(`?folder=${folderId}`, { replace: true });
  }, [navigate, updateFilters, fetchBookmarks, user]);
  
  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Breadcrumb navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">
              {selectedFolderName ? selectedFolderName : "All Conversations"}
            </h1>
          </div>
        </div>
        
        {/* Main content area with flexible layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Folder panel - fixed width */}
          <div className="w-80 xl:w-96 border-r border-border overflow-y-auto">
            <div className="p-4 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">
                  Folders
                </h2>
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
          </div>
          
          {/* Bookmark content - takes remaining space */}
          <div className="flex-1 p-2 sm:p-4 overflow-auto">
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