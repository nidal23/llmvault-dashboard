import BookmarkList from "@/components/bookmarks/BookmarkList";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBookmarksStore } from "@/lib/stores/useBookmarksStore";
import { Loader2, Plus } from "lucide-react";
import { useFoldersStore } from '@/lib/stores/useFoldersStore';
import { Button } from "@/components/ui/button";

const Bookmarks = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const folderParam = query.get('folder');
  const { user } = useAuth();
  
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderParam);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);

  const { 
    folders,
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
  
  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Breadcrumb navigation with Add button */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">
            {selectedFolderName ? selectedFolderName : "All Conversations"}
          </h1>
          {/* Add Conversation button */}
          <Button 
            className="apple-button sm:flex" 
            onClick={() => {
              // Find the existing new bookmark button in BookmarkList and click it
              const addButton = document.querySelector('.bookmark-add-button');
              if (addButton && addButton instanceof HTMLElement) {
                addButton.click();
              }
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Conversation
          </Button>
        </div>
        
        {/* Main content area */}
        <div className="flex-1">
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
    </Layout>
  );
};

export default Bookmarks;