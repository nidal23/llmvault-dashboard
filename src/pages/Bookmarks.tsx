//pages/Bookmarks.tsx
import BookmarkList from "@/components/bookmarks/BookmarkList";
import FolderTree from "@/components/folders/FolderTree";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBookmarksStore } from "@/lib/stores/useBookmarksStore";
import { Loader2 } from "lucide-react";
import { useFoldersStore } from "@/lib/stores/useFoldersStore";

const Bookmarks = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const folderParam = query.get('folder');
  const { user } = useAuth();
  
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderParam);
  
  // Use the custom folders hook
  // const { 
  //   folders, 
  //   isLoading: isLoadingFolders,
  //   error: foldersError
  // } = useFolders({ 
  //   autoFetch: !!user 
  // });

  const { 
    folders, 
    isLoading: isLoadingFolders,
    error: foldersError,
    fetchFolders
  } = useFoldersStore();
  
  useEffect(() => {
    if (user) {
      fetchFolders(user.id);
    }
  }, [user, fetchFolders]);

  const { 
    bookmarks, 
    isLoading: isLoadingBookmarks,
    error: bookmarksError,
    updateFilters,
    fetchBookmarks
  } = useBookmarksStore();

  useEffect(() => {
    if (user) {
      fetchBookmarks(user.id, {
        folderId: selectedFolder || undefined
      });
    }
  }, [user, selectedFolder, fetchBookmarks]);

  

  console.log('bookmarks returned:  ', bookmarks)
  // Update selected folder when URL parameter changes
  useEffect(() => {
    if (folderParam !== selectedFolder) {
      setSelectedFolder(folderParam);
      
      // Update bookmarks filter when folder changes
      if (user) {
        updateFilters({ folderId: folderParam || undefined });
        fetchBookmarks(user.id, { folderId: folderParam || undefined });
      }
    }
  }, [folderParam, selectedFolder, user, updateFilters, fetchBookmarks]);
  
  // Get the name of the selected folder
  const selectedFolderName = selectedFolder 
    ? folders.find(folder => folder.id === selectedFolder)?.name
    : null;
  
    const handleFolderSelect = (folderId: string) => {
      setSelectedFolder(folderId);
      updateFilters({ folderId });
      
      if (user) {
        fetchBookmarks(user.id, { folderId });
      }
    };
  
    return (
      <Layout>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Folders</CardTitle>
                <CardDescription>
                  Browse your organized folders
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
              />
            )}
          </div>
        </div>
      </Layout>
    );
};

export default Bookmarks;