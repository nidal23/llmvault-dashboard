// src/components/prompts/PromptEditor.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ChevronLeft, 
  Save, 
  Trash, 
  ExternalLink, 
  Star, 
  Code,
  AlertCircle,
  Link as LinkIcon,
  BarChart2,
  MessageSquare,
  Folder,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePromptsStore } from "@/lib/stores/usePromptsStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBookmarksStore } from "@/lib/stores/useBookmarksStore";
import { useFoldersStore } from "@/lib/stores/useFoldersStore";
import { toast } from "sonner";
import { Bookmark, FolderWithCount, Folder as LinkedFolder } from "@/lib/supabase/database.types";

const PromptEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isNewPrompt = id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { 
    fetchPromptById, 
    createPrompt, 
    updatePrompt, 
    deletePrompt,
    toggleFavorite,
    incrementUsage,
    linkToBookmark,
    linkToFolder,
    unlinkFromBookmark,
    unlinkFromFolder,
    fetchLinkedBookmarks,
    fetchLinkedFolders
  } = usePromptsStore();
  
  const { bookmarks, fetchBookmarks } = useBookmarksStore();
  const { folders, fetchFolders } = useFoldersStore();
  
  // Main prompt state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  
  // UI state
  const [tagInput, setTagInput] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  
  // Linked items state
  const [linkedBookmarks, setLinkedBookmarks] = useState<Bookmark[]>([]);
  const [linkedFolders, setLinkedFolders] = useState<LinkedFolder[]>([]);
  
  // Load prompt data if editing existing prompt
  useEffect(() => {
    if (!isNewPrompt && id) {
      const loadPrompt = async () => {
        try {
          const promptData = await fetchPromptById(id);
          if (promptData) {
            setTitle(promptData.title || "");
            setDescription(promptData.description || "");
            setContent(promptData.content || "");
            setCategory(promptData.category || "");
            setTags(promptData.tags || []);
            setIsFavorite(promptData.is_favorite || false);
            setUsageCount(promptData.usage || 0);
            
            // Load linked bookmarks and folders
            const bookmarks = await fetchLinkedBookmarks(id);
            const folders = await fetchLinkedFolders(id);
            setLinkedBookmarks(bookmarks);
            setLinkedFolders(folders);
          }
        } catch (error) {
          console.error("Error loading prompt:", error);
          toast.error("Failed to load prompt");
        }
      };
      
      loadPrompt();
    }
    
    // Load available bookmarks and folders for linking
    if (user) {
      fetchBookmarks(user.id).then(bookmarksData => {
      console.log("Bookmarks loaded:", bookmarksData);
    });
    fetchFolders(user.id).then(foldersData => {
      console.log("Folders loaded:", foldersData);
    });
    }
  }, [id, isNewPrompt, user, fetchPromptById, fetchBookmarks, fetchFolders, fetchLinkedBookmarks, fetchLinkedFolders]);
  
  const handleSave = async () => {
  if (!user) {
    toast.error("You must be logged in to save prompts");
    return;
  }
  
  if (!title.trim() || !content.trim()) {
    toast.error("Title and content are required");
    return;
  }
  
  setIsSaving(true);
  
  try {
    if (isNewPrompt) {
      // Use the correct type for createPrompt
      const promptData = {
        title,
        content,
        user_id: user.id,
        description: description || null,
        category: category || null,
        tags: tags.length > 0 ? tags : null,
        is_favorite: isFavorite
      };
      
      const newPrompt = await createPrompt(promptData);
      toast.success("Prompt created successfully");
      navigate(`/prompts/${newPrompt.id}`);
    } else if (id) {
      // For updates, use the update type
      await updatePrompt(id, {
        title,
        description,
        content,
        category,
        tags,
        is_favorite: isFavorite
      });
      toast.success("Prompt updated successfully");
    }
  } catch (error) {
    console.error("Error saving prompt:", error);
    toast.error("Failed to save prompt");
  } finally {
    setIsSaving(false);
  }
};
  
  const handleDelete = async () => {
    if (!id || isNewPrompt) return;
    
    setIsDeleting(true);
    
    try {
      await deletePrompt(id);
      toast.success("Prompt deleted successfully");
      navigate("/prompts");
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt");
      setIsDeleting(false);
    }
  };

    const organizeFoldersHierarchy = (allFolders: LinkedFolder[]): FolderWithCount[] => {
    const folderMap = new Map<string, FolderWithCount>();
    const rootFolders: FolderWithCount[] = [];
    
    // First pass: create a map of all folders with their data
    allFolders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });
    
    // Second pass: organize into hierarchy
    folderMap.forEach(folder => {
      if (folder.parent_id && folderMap.has(folder.parent_id)) {
        // This is a child folder, add it to its parent's children
        const parent = folderMap.get(folder.parent_id);
        parent?.children?.push(folder);
      } else {
        // This is a root folder
        rootFolders.push(folder);
      }
    });
    
    return rootFolders;
  };

  const renderFolderOptions = (
    folders: FolderWithCount[], 
    depth: number = 0,
    linkedFolderIds: string[] = []
  ) => {
    return folders.map(folder => (
      <React.Fragment key={folder.id}>
        <SelectItem 
          value={folder.id} 
          disabled={linkedFolderIds.includes(folder.id)}
          className={`pl-${depth * 4 + 2}`}
        >
          {depth > 0 && "┗ "}{folder.name}
        </SelectItem>
        {folder.children && folder.children.length > 0 && 
          renderFolderOptions(folder.children, depth + 1, linkedFolderIds)
        }
      </React.Fragment>
    ));
  };
  
  const handleToggleFavorite = async () => {
    if (isNewPrompt) {
      setIsFavorite(!isFavorite);
      return;
    }
    
    if (!id) return;
    
    try {
      await toggleFavorite(id);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite status");
    }
  };
  
  const handleUsePrompt = async () => {
    if (!id || isNewPrompt) return;
    
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(content);
      toast.success("Prompt copied to clipboard");
      
      // Update usage count
      await incrementUsage(id);
      setUsageCount(prev => prev + 1);
      
      // Open default platform in new tab
      window.open("https://chat.openai.com/", "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error using prompt:", error);
      toast.error("Failed to copy prompt");
    }
  };
  
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim().toLowerCase();
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    
    setTagInput("");
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const handleLinkBookmark = async (bookmarkId: string) => {
    if (!id || isNewPrompt) return;
    
    try {
      await linkToBookmark(id, bookmarkId);
      const updatedBookmarks = await fetchLinkedBookmarks(id);
      setLinkedBookmarks(updatedBookmarks);
      toast.success("Bookmark linked successfully");
    } catch (error) {
      console.error("Error linking bookmark:", error);
      toast.error("Failed to link bookmark");
    }
  };
  
  const handleUnlinkBookmark = async (bookmarkId: string) => {
    if (!id || isNewPrompt) return;
    
    try {
      await unlinkFromBookmark(id, bookmarkId);
      const updatedBookmarks = await fetchLinkedBookmarks(id);
      setLinkedBookmarks(updatedBookmarks);
      toast.success("Bookmark unlinked successfully");
    } catch (error) {
      console.error("Error unlinking bookmark:", error);
      toast.error("Failed to unlink bookmark");
    }
  };
  
  const handleLinkFolder = async (folderId: string) => {
    if (!id || isNewPrompt) return;
    
    try {
      await linkToFolder(id, folderId);
      const updatedFolders = await fetchLinkedFolders(id);
      setLinkedFolders(updatedFolders);
      toast.success("Folder linked successfully");
    } catch (error) {
      console.error("Error linking folder:", error);
      toast.error("Failed to link folder");
    }
  };
  
  const handleUnlinkFolder = async (folderId: string) => {
    if (!id || isNewPrompt) return;
    
    try {
      await unlinkFromFolder(id, folderId);
      const updatedFolders = await fetchLinkedFolders(id);
      setLinkedFolders(updatedFolders);
      toast.success("Folder unlinked successfully");
    } catch (error) {
      console.error("Error unlinking folder:", error);
      toast.error("Failed to unlink folder");
    }
  };

  const linkedFolderIds = linkedFolders.map(f => f.id);
  const hierarchicalFolders = organizeFoldersHierarchy(folders);

  
  return (
    <div className="space-y-6">
      {/* Header with back button, title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/prompts")}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isNewPrompt ? "Create New Prompt" : "Edit Prompt"}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {!isNewPrompt && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleToggleFavorite}
                    >
                      <Star 
                        className="h-4 w-4" 
                        fill={isFavorite ? "currentColor" : "none"} 
                        color={isFavorite ? "#f59e0b" : "currentColor"}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete prompt</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
          
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !title.trim() || !content.trim()}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </Button>
          
          {!isNewPrompt && (
            <Button 
              variant="primary"
              onClick={handleUsePrompt}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Use Prompt</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="editor" className="flex items-center gap-1.5">
            <Code className="h-4 w-4" />
            <span>Editor</span>
          </TabsTrigger>
          
          <TabsTrigger value="links" className="flex items-center gap-1.5">
            <LinkIcon className="h-4 w-4" />
            <span>Linked Items</span>
          </TabsTrigger>
          
          {!isNewPrompt && (
            <TabsTrigger value="usage" className="flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="editor" className="pt-6">
          <div className="space-y-6">
            {/* Title & description */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Label htmlFor="title" className="mb-2 block">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your prompt a descriptive title"
                  maxLength={100}
                  className="mb-2"
                />
                
                <div className="text-xs text-muted-foreground text-right">
                  {title.length}/100
                </div>
              </div>
              
              <div>
                <Label htmlFor="category" className="mb-2 block">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="writing">Writing</SelectItem>
                    <SelectItem value="coding">Coding</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                   <SelectItem value="creative">Creative</SelectItem>
                   <SelectItem value="business">Business</SelectItem>
                   <SelectItem value="education">Education</SelectItem>
                   <SelectItem value="personal">Personal</SelectItem>
                   <SelectItem value="other">Other</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
           
           {/* Description */}
           <div>
             <Label htmlFor="description" className="mb-2 block">Description</Label>
             <Textarea
               id="description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Describe what this prompt is designed to do"
               className="min-h-24 resize-y mb-2"
               maxLength={500}
             />
             <div className="text-xs text-muted-foreground text-right">
               {description.length}/500
             </div>
           </div>
           
           {/* Tags */}
           <div>
             <Label htmlFor="tags" className="mb-2 block">Tags</Label>
             <div className="flex flex-wrap gap-2 mb-2">
               {tags.map((tag) => (
                 <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                   {tag}
                   <button 
                     onClick={() => handleRemoveTag(tag)} 
                     className="text-muted-foreground hover:text-foreground ml-1"
                   >
                     ×
                   </button>
                 </Badge>
               ))}
               
               {tags.length === 0 && (
                 <span className="text-sm text-muted-foreground">
                   No tags added yet
                 </span>
               )}
             </div>
             
             <div className="flex items-center gap-2">
               <Input
                 id="tags"
                 value={tagInput}
                 onChange={(e) => setTagInput(e.target.value)}
                 onKeyDown={handleTagKeyDown}
                 placeholder="Add a tag"
                 className="max-w-xs"
               />
               <Button 
                 type="button" 
                 variant="outline" 
                 onClick={handleAddTag}
                 disabled={!tagInput.trim()}
               >
                 Add
               </Button>
             </div>
           </div>
           
           {/* Content */}
           <div>
             <Label htmlFor="content" className="mb-2 block">Prompt Content</Label>
             <div className="flex items-center gap-2 mb-2">
               <AlertCircle className="h-4 w-4 text-amber-500" />
               <span className="text-sm text-muted-foreground">
                 Write your prompt exactly as you would send it to an AI assistant
               </span>
             </div>
             <Textarea
               id="content"
               value={content}
               onChange={(e) => setContent(e.target.value)}
               placeholder="Type your prompt here..."
               className="min-h-48 resize-y font-mono mb-2"
             />
             <div className="text-xs text-muted-foreground text-right">
               {content.length} characters
             </div>
           </div>
         </div>
       </TabsContent>
       
       <TabsContent value="links" className="pt-6">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Linked bookmarks */}
           <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Linked Conversations</span>
            </h3>
            
            {isNewPrompt ? (
              <div className="border border-dashed rounded-lg p-6 text-center">
                <p className="text-muted-foreground">
                  Save your prompt first before linking conversations
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Linked Conversations</Label>
                  {bookmarks.length === 0 ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toast.info("No conversations available to link")}
                      className="w-[200px] flex justify-between items-center"
                      disabled
                    >
                      <span>No conversations</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  ) : (
                    <Select onValueChange={(value) => handleLinkBookmark(value)}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Add conversation" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {bookmarks
                          .filter(bookmark => !linkedBookmarks.some(b => b.id === bookmark.id))
                          .map(bookmark => (
                            <SelectItem key={bookmark.id} value={bookmark.id}>
                              <div className="truncate">
                                {bookmark.title || "Untitled Conversation"}
                              </div>
                            </SelectItem>
                          ))}
                        {bookmarks.length > 0 && 
                        bookmarks.filter(bookmark => !linkedBookmarks.some(b => b.id === bookmark.id)).length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground">
                            All conversations are already linked
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                {linkedBookmarks.length === 0 ? (
                  <div className="border border-dashed rounded-lg p-6 text-center">
                    <p className="text-muted-foreground">
                      No conversations linked yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Use the dropdown above to link conversations with this prompt
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkedBookmarks.map(bookmark => (
                      <Card key={bookmark.id} className="group relative hover:bg-secondary/5">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="h-4 w-4 text-primary/70" />
                              <div>
                                <div className="font-medium line-clamp-1">
                                  {bookmark.title || "Untitled"}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {bookmark.created_at 
                                    ? new Date(bookmark.created_at).toLocaleDateString()
                                    : "No date"
                                  }
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {bookmark.platform && (
                                <Badge variant="outline" className="text-xs bg-primary/5">
                                  {bookmark.platform}
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleUnlinkBookmark(bookmark.id)}
                              >
                                <Trash className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
           
           {/* Linked folders */}
           <div>
             <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
               <Folder className="h-4 w-4 text-primary" />
               <span>Linked Folders</span>
             </h3>
             
             {isNewPrompt ? (
               <div className="border border-dashed rounded-lg p-6 text-center">
                 <p className="text-muted-foreground">
                   Save your prompt first before linking folders
                 </p>
               </div>
             ) : (
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <Label>Linked Folders</Label>
                   <Select onValueChange={(value) => handleLinkFolder(value)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Add folder" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {folders.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No folders available
                        </div>
                      ) : (
                        renderFolderOptions(hierarchicalFolders, 0, linkedFolderIds)
                      )}
                    </SelectContent>
                  </Select>
                 </div>
                 
                 {linkedFolders.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-6 text-center">
                      <p className="text-muted-foreground">
                        No folders linked yet
                      </p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="mt-2"
                      >
                        Link folders to organize related prompts
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {linkedFolders.map(folder => (
                        <Card key={folder.id} className="group relative hover:bg-secondary/5">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <Folder className="h-4 w-4 text-primary/70" />
                                <div>
                                  <div className="font-medium line-clamp-1">
                                    {folder.name || "Untitled"}
                                  </div>
                                  {folder.parent_id && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <ChevronRight className="h-3 w-3" /> 
                                      {folders.find(f => f.id === folder.parent_id)?.name || "Parent Folder"}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs bg-primary/5">
                                  {(folder as FolderWithCount).bookmarkCount || 0} items
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleUnlinkFolder(folder.id)}
                                >
                                  <Trash className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
               </div>
             )}
           </div>
         </div>
       </TabsContent>
       
       <TabsContent value="usage" className="pt-6">
         <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card>
               <CardContent className="p-6">
                 <div className="text-2xl font-bold">{usageCount}</div>
                 <div className="text-sm text-muted-foreground">Total Uses</div>
               </CardContent>
             </Card>
             
             <Card>
               <CardContent className="p-6">
                 <div className="text-2xl font-bold">{linkedBookmarks?.length || 0}</div>
                 <div className="text-sm text-muted-foreground">Linked Conversations</div>
               </CardContent>
             </Card>
             
             <Card>
               <CardContent className="p-6">
                 <div className="text-2xl font-bold">{linkedFolders?.length || 0}</div>
                 <div className="text-sm text-muted-foreground">Linked Folders</div>
               </CardContent>
             </Card>
           </div>
           
           <div className="border border-dashed rounded-lg p-8 text-center">
             <h3 className="text-lg font-medium mb-2">Usage Analytics</h3>
             <p className="text-muted-foreground mb-6">
               Detailed usage analytics are coming soon!
             </p>
             <p className="text-sm text-muted-foreground">
               Track which prompts generate the best responses and how often you use each prompt.
             </p>
           </div>
         </div>
       </TabsContent>
     </Tabs>
     
     {/* Delete confirmation dialog */}
     <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
       <DialogContent>
         <DialogHeader>
           <DialogTitle>Delete Prompt</DialogTitle>
           <DialogDescription>
             Are you sure you want to delete this prompt? This action cannot be undone.
           </DialogDescription>
         </DialogHeader>
         <DialogFooter>
           <Button 
             variant="outline" 
             onClick={() => setIsDeleteDialogOpen(false)}
             disabled={isDeleting}
           >
             Cancel
           </Button>
           <Button 
             variant="destructive"
             onClick={handleDelete}
             disabled={isDeleting}
           >
             {isDeleting ? "Deleting..." : "Delete"}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   </div>
 );
};

export default PromptEditor;