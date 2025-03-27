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
import { useAuth } from "@/lib/context/AuthContext";
import { useBookmarks } from "@/lib/hooks/useBookmarks";
import { useFolders } from "@/lib/hooks/useFolders";
import { Loader2 } from "lucide-react";

const Bookmarks = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const folderParam = query.get('folder');
  const { initialized } = useAuth();
  
  const [selectedFolder, setSelectedFolder] = useState<string | null>(folderParam);
  
  // Use the custom folders hook
  const { 
    folders, 
    isLoading: isLoadingFolders,
    error: foldersError
  } = useFolders({ 
    autoFetch: initialized 
  });
  
  // Use the custom bookmarks hook with dynamic filters
  const { 
    bookmarks, 
    isLoading: isLoadingBookmarks,
    error: bookmarksError,
    updateFilters
  } = useBookmarks({
    folderId: selectedFolder || undefined
  }, { 
    autoFetch: initialized 
  });
  
  // Update selected folder when URL parameter changes
  useEffect(() => {
    if (folderParam !== selectedFolder) {
      setSelectedFolder(folderParam);
      
      // Update bookmarks filter when folder changes
      if (initialized) {
        updateFilters({ folderId: folderParam || undefined });
      }
    }
  }, [folderParam, selectedFolder, initialized, updateFilters]);
  
  // Get the name of the selected folder
  const selectedFolderName = selectedFolder 
    ? folders.find(folder => folder.id === selectedFolder)?.name
    : null;
  
  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId);
    updateFilters({ folderId });
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