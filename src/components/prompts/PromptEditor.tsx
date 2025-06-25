// src/components/prompts/PromptEditor.tsx - Updated with better folder integration
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  Save,
  Trash,
  Star,
  Code,
  AlertCircle,
  Link as LinkIcon,
  BarChart2,
  MessageSquare,
  Folder,
  ChevronRight,
  ChevronDown,
  Search,
  FolderTree,
  Zap,
  Plus, // ADD THIS
  X, // ADD THIS
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
import { usePromptFoldersStore } from "@/lib/stores/usePromptFoldersStore";
import { toast } from "sonner";
import {
  Bookmark,
  Folder as LinkedFolder,
  PromptFolderWithCount,
} from "@/lib/supabase/database.types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import PlatformLauncher, {
  LLM_PLATFORMS,
  isPlatformKey,
  type PlatformKey,
} from "./PlatformLauncher";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PromptFolderTreeNode extends PromptFolderWithCount {
  children: PromptFolderTreeNode[];
}

// Enhanced TreeFolderSelector for Prompt Folders
const PromptFolderSelector = ({
  folders,
  selectedFolderId,
  onSelect,
  className,
  placeholder = "Select a folder",
}: {
  folders: PromptFolderWithCount[];
  selectedFolderId: string;
  onSelect: (folderId: string) => void;
  className?: string;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  // Get selected folder name
  const selectedFolder = React.useMemo(
    () => folders.find((f) => f.id === selectedFolderId),
    [folders, selectedFolderId]
  );

  // Organize folders into a tree structure
  const folderTree = React.useMemo(() => {
    const buildFolderTree = (
      parentId: string | null
    ): PromptFolderTreeNode[] => {
      return folders
        .filter((folder) => folder.parent_id === parentId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((folder) => ({
          ...folder,
          children: buildFolderTree(folder.id),
        }));
    };

    return buildFolderTree(null);
  }, [folders]);

  // Filter folders based on search query
  const filteredFolderTree = React.useMemo(() => {
    if (!searchQuery.trim()) return folderTree;

    const folderOrDescendantsMatch = (
      folder: PromptFolderTreeNode
    ): boolean => {
      const nameMatches = folder.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      if (nameMatches) return true;
      if (folder.children && folder.children.length > 0) {
        return folder.children.some((child) => folderOrDescendantsMatch(child));
      }
      return false;
    };

    const filterTree = (
      tree: PromptFolderTreeNode[]
    ): PromptFolderTreeNode[] => {
      return tree
        .filter((folder) => folderOrDescendantsMatch(folder))
        .map((folder) => ({
          ...folder,
          children: folder.children ? filterTree(folder.children) : [],
        }));
    };

    return filterTree(folderTree);
  }, [folderTree, searchQuery]);

  // Toggle folder expansion
  const toggleFolder = React.useCallback(
    (folderId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedFolders((prev) =>
        prev.includes(folderId)
          ? prev.filter((id) => id !== folderId)
          : [...prev, folderId]
      );
    },
    []
  );

  // Render folder tree
  const renderFolderTree = React.useCallback(
    (tree: PromptFolderTreeNode[], level = 0) => {
      return tree.map((folder) => {
        const hasChildren = folder.children && folder.children.length > 0;
        const isExpanded = expandedFolders.includes(folder.id);
        const isSelected = folder.id === selectedFolderId;

        return (
          <div key={folder.id} className="select-none">
            <div
              className={cn(
                "flex items-center py-1 px-2 rounded-md text-sm cursor-pointer",
                isSelected
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent",
                "transition-colors"
              )}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => {
                onSelect(folder.id);
                setOpen(false);
              }}
            >
              <div
                className="mr-1 flex h-5 w-5 items-center justify-center"
                onClick={(e) =>
                  hasChildren ? toggleFolder(folder.id, e) : undefined
                }
              >
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )
                ) : (
                  <span className="w-4" />
                )}
              </div>
              <FolderTree className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
              <span className="truncate flex-1">{folder.name}</span>
              {folder.promptCount !== undefined && folder.promptCount > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {folder.promptCount}
                </span>
              )}
              {isSelected && <div className="ml-2 h-4 w-4 text-primary">✓</div>}
            </div>

            {hasChildren && isExpanded && (
              <div className="ml-2">
                {renderFolderTree(folder.children, level + 1)}
              </div>
            )}
          </div>
        );
      });
    },
    [expandedFolders, selectedFolderId, onSelect, toggleFolder]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center overflow-hidden">
            <FolderTree className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selectedFolder ? selectedFolder.name : placeholder}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="flex flex-col">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
            <Input
              placeholder="Search folders..."
              className="h-8 flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[300px] max-h-[50vh]">
            <div className="p-2">
              {filteredFolderTree.length > 0 ? (
                renderFolderTree(filteredFolderTree)
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {searchQuery
                    ? "No matching folders found"
                    : "No folders available"}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const PromptEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isNewPrompt = id === "new";
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const {
    fetchPromptById,
    createPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    linkToBookmark,
    linkToFolder,
    unlinkFromBookmark,
    unlinkFromFolder,
    fetchLinkedBookmarks,
    fetchLinkedFolders,
  } = usePromptsStore();

  const { bookmarks, fetchBookmarks, updateFilters } = useBookmarksStore();
  const { folders, fetchFolders } = useFoldersStore();
  const { folders: promptFolders, fetchFolders: fetchPromptFolders } =
    usePromptFoldersStore();

  // Parse URL parameters
  const searchParams = new URLSearchParams(location.search);
  const urlFolderId = searchParams.get("folder");

  // Main prompt state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [promptFolderId, setPromptFolderId] = useState<string>(
    urlFolderId || ""
  );
  const [preferredPlatforms, setPreferredPlatforms] = useState<string[]>([]);

  // UI state
  const [tagInput, setTagInput] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");

  // Linked items state
  const [linkedBookmarks, setLinkedBookmarks] = useState<Bookmark[]>([]);
  const [linkedFolders, setLinkedFolders] = useState<LinkedFolder[]>([]);

  const [isAddingPlatform, setIsAddingPlatform] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");

  // Set initial folder from URL parameter
  useEffect(() => {
    if (isNewPrompt && urlFolderId && !promptFolderId) {
      setPromptFolderId(urlFolderId);
    }
  }, [isNewPrompt, urlFolderId, promptFolderId]);

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
            setPromptFolderId(promptData.folder_id || "");
            setPreferredPlatforms(promptData.preferred_platforms || []);

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
      updateFilters({ folderId: undefined });
      fetchBookmarks(user.id, { folderId: undefined });
      fetchFolders(user.id);
      fetchPromptFolders(user.id);
    }
  }, [
    id,
    isNewPrompt,
    user,
    fetchPromptById,
    fetchBookmarks,
    fetchFolders,
    fetchPromptFolders,
    fetchLinkedBookmarks,
    fetchLinkedFolders,
    updateFilters,
  ]);

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
        const promptData = {
          title,
          content,
          user_id: user.id,
          description: description || null,
          category: category || null,
          tags: tags.length > 0 ? tags : null,
          is_favorite: isFavorite,
          folder_id: promptFolderId || null,
          preferred_platforms:
            preferredPlatforms.length > 0 ? preferredPlatforms : null,
        };

        const newPrompt = await createPrompt(user.id, promptData);
        toast.success("Prompt created successfully");
        navigate(`/prompts/${newPrompt.id}`);
      } else if (id) {
        await updatePrompt(id, {
          title,
          description,
          content,
          category,
          tags,
          is_favorite: isFavorite,
          folder_id: promptFolderId || null,
          preferred_platforms:
            preferredPlatforms.length > 0 ? preferredPlatforms : null,
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

  const handleAddPlatformFromDropdown = async () => {
    if (!selectedPlatform || preferredPlatforms.includes(selectedPlatform)) {
      return;
    }

    if (!isPlatformKey(selectedPlatform)) {
      toast.error("Invalid platform selected");
      return;
    }

    // Update local state immediately for better UX
    const updatedPlatforms = [...preferredPlatforms, selectedPlatform];
    setPreferredPlatforms(updatedPlatforms);
    setSelectedPlatform("");
    setIsAddingPlatform(false);

    // If editing existing prompt, save to database
    if (!isNewPrompt && id) {
      try {
        await updatePrompt(id, {
          preferred_platforms:
            updatedPlatforms.length > 0 ? updatedPlatforms : null,
        });
        toast.success(`${selectedPlatform} added to preferred platforms`);
      } catch (error) {
        console.error("Error updating preferred platforms:", error);
        // Rollback on error
        setPreferredPlatforms(preferredPlatforms);
        toast.error("Failed to save platform preference");
      }
    } else {
      // For new prompts, just show success (will be saved when prompt is saved)
      toast.success(`${selectedPlatform} added to preferred platforms`);
    }
  };

  const handleRemovePlatform = async (platformToRemove: string) => {
    // Update local state immediately for better UX
    const updatedPlatforms = preferredPlatforms.filter(
      (platform) => platform !== platformToRemove
    );
    setPreferredPlatforms(updatedPlatforms);

    // If editing existing prompt, save to database
    if (!isNewPrompt && id) {
      try {
        await updatePrompt(id, {
          preferred_platforms:
            updatedPlatforms.length > 0 ? updatedPlatforms : null,
        });
        toast.success(`${platformToRemove} removed from preferred platforms`);
      } catch (error) {
        console.error("Error updating preferred platforms:", error);
        // Rollback on error
        setPreferredPlatforms(preferredPlatforms);
        toast.error("Failed to save platform preference");
      }
    } else {
      // For new prompts, just show success (will be saved when prompt is saved)
      toast.success(`${platformToRemove} removed from preferred platforms`);
    }
  };

  const availablePlatforms = (
    Object.keys(LLM_PLATFORMS) as PlatformKey[]
  ).filter((platform) => !preferredPlatforms.includes(platform));

  const handleAddTag = () => {
    if (!tagInput.trim()) return;

    const newTag = tagInput.trim().toLowerCase();
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }

    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Linking functions (same as before)
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

  // Get list of bookmarks that aren't already linked
  const availableBookmarks = bookmarks.filter(
    (bookmark) => !linkedBookmarks.some((b) => b.id === bookmark.id)
  );

  // Get list of folders that aren't already linked
  const linkedFolderIds = linkedFolders.map((f) => f.id);

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
          {promptFolderId && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-700 border-amber-500/30"
            >
              <FolderTree className="h-3 w-3 mr-1" />
              {promptFolders.find((f) => f.id === promptFolderId)?.name ||
                "Unknown Folder"}
            </Badge>
          )}
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
                    <p>
                      {isFavorite
                        ? "Remove from favorites"
                        : "Add to favorites"}
                    </p>
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

          {!isNewPrompt && content.trim() && (
            <div className="flex items-center gap-2">
              <PlatformLauncher
                promptContent={content}
                preferredPlatforms={preferredPlatforms}
                variant="compact"
                className="border rounded-lg px-3 py-2 bg-background"
              />
            </div>
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
            {/* Title & description & category */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Label htmlFor="title" className="mb-2 block">
                  Title
                </Label>
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
                <Label htmlFor="category" className="mb-2 block">
                  Category
                </Label>
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
            {/* Prompt Folder Selection */}
            <div>
              <Label htmlFor="prompt-folder" className="mb-2 block">
                Prompt Folder
              </Label>
              <PromptFolderSelector
                folders={promptFolders}
                selectedFolderId={promptFolderId}
                onSelect={setPromptFolderId}
                placeholder="Select a prompt folder (optional)"
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Organize your prompt in a folder for better management
              </p>
            </div>
            {/* Description */}
            <div>
              <Label htmlFor="description" className="mb-2 block">
                Description
              </Label>
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
              <Label htmlFor="tags" className="mb-2 block">
                Tags
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
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
                  className="border border-accent text-amber-50"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
            {/* Preferred Platforms */}
            <div>
              <Label
                htmlFor="platforms"
                className="mb-3 block text-sm font-medium"
              >
                Preferred Platforms
              </Label>

              {/* Selected Platforms Display */}
              <div className="flex flex-wrap gap-2 mb-4">
                {preferredPlatforms.map((platformName) => {
                  if (!isPlatformKey(platformName)) return null;
                  const platform = LLM_PLATFORMS[platformName];

                  return (
                    <Badge
                      key={platformName}
                      variant="outline"
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border-2 hover:shadow-sm transition-all"
                      style={{
                        borderColor: `${platform.color}40`,
                        backgroundColor: `${platform.color}10`,
                        color: platform.color,
                      }}
                    >
                      <span className="text-base">{platform.icon}</span>
                      <span className="font-medium">{platform.name}</span>
                      <button
                        onClick={() => handleRemovePlatform(platformName)}
                        className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${platform.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>

              {/* Empty State with Add Button */}
              {preferredPlatforms.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-6 text-center mb-4">
                  <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No preferred platforms set
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Add platforms to show quick launch buttons when using this
                    prompt
                  </p>

                  {/* Add Platform Button in Empty State */}
                  <Popover
                    open={isAddingPlatform}
                    onOpenChange={setIsAddingPlatform}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dashed border-2 hover:border-solid transition-all flex items-center gap-2"
                        disabled={availablePlatforms.length === 0}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Your First Platform</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="center">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-3">
                            Add Platform
                          </h4>
                          <Select
                            value={selectedPlatform}
                            onValueChange={setSelectedPlatform}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose a platform" />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePlatforms.map((platformName) => {
                                const platform = LLM_PLATFORMS[platformName];
                                return (
                                  <SelectItem
                                    key={platformName}
                                    value={platformName}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg">
                                        {platform.icon}
                                      </span>
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {platform.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {platform.description}
                                        </span>
                                      </div>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsAddingPlatform(false);
                              setSelectedPlatform("");
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddPlatformFromDropdown}
                            disabled={!selectedPlatform}
                            className="flex-1"
                          >
                            Add Platform
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Add More Platforms Button (when platforms exist) */}
              {preferredPlatforms.length > 0 &&
                availablePlatforms.length > 0 && (
                  <Popover
                    open={isAddingPlatform}
                    onOpenChange={setIsAddingPlatform}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dashed border-2 hover:border-solid transition-all flex items-center gap-2 mb-4"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Platform</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="start">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-3">
                            Add Platform
                          </h4>
                          <Select
                            value={selectedPlatform}
                            onValueChange={setSelectedPlatform}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose a platform" />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePlatforms.map((platformName) => {
                                const platform = LLM_PLATFORMS[platformName];
                                return (
                                  <SelectItem
                                    key={platformName}
                                    value={platformName}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg">
                                        {platform.icon}
                                      </span>
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {platform.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {platform.description}
                                        </span>
                                      </div>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsAddingPlatform(false);
                              setSelectedPlatform("");
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddPlatformFromDropdown}
                            disabled={!selectedPlatform}
                            className="flex-1"
                          >
                            Add Platform
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

              <p className="text-xs text-muted-foreground">
                Specify which AI platforms work best with this prompt. These
                will appear as quick launch buttons.
              </p>
            </div>
            {/* Content */}
            <div>
              <Label htmlFor="content" className="mb-2 block">
                Prompt Content
              </Label>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">
                  Write your prompt exactly as you would send it to an AI
                  assistant
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
            {/* Linked bookmarks section */}
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
                    <Label>Add Conversation</Label>
                    {availableBookmarks.length === 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-[200px] flex justify-between items-center"
                        disabled
                      >
                        <span>No conversations available</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    ) : (
                      <Select
                        onValueChange={(value) => handleLinkBookmark(value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select conversation" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {availableBookmarks.map((bookmark) => (
                            <SelectItem key={bookmark.id} value={bookmark.id}>
                              <div className="truncate">
                                {bookmark.title || "Untitled Conversation"}
                              </div>
                            </SelectItem>
                          ))}
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
                        Use the dropdown above to link conversations with this
                        prompt
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {linkedBookmarks.map((bookmark) => (
                        <Card
                          key={bookmark.id}
                          className="group relative hover:bg-secondary/5"
                        >
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
                                      ? new Date(
                                          bookmark.created_at
                                        ).toLocaleDateString()
                                      : "No date"}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {bookmark.platform && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-primary/5"
                                  >
                                    {bookmark.platform}
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() =>
                                    handleUnlinkBookmark(bookmark.id)
                                  }
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

            {/* Linked bookmark folders section */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Folder className="h-4 w-4 text-primary" />
                <span>Linked Bookmark Folders</span>
              </h3>

              {isNewPrompt ? (
                <div className="border border-dashed rounded-lg p-6 text-center">
                  <p className="text-muted-foreground">
                    Save your prompt first before linking bookmark folders
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label>Add Bookmark Folder</Label>
                    <div className="w-[200px]">
                      {folders.length === 0 ? (
                        <Button
                          variant="outline"
                          className="w-full flex justify-between items-center"
                          disabled
                        >
                          <span>No bookmark folders available</span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      ) : (
                        <Select onValueChange={handleLinkFolder}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a bookmark folder" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {folders
                              .filter((f) => !linkedFolderIds.includes(f.id))
                              .map((folder) => (
                                <SelectItem key={folder.id} value={folder.id}>
                                  <div className="truncate">{folder.name}</div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  {linkedFolders.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-6 text-center">
                      <p className="text-muted-foreground">
                        No bookmark folders linked yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Link bookmark folders to show this prompt is related to
                        certain conversation topics
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {linkedFolders.map((folder) => (
                        <Card
                          key={folder.id}
                          className="group relative hover:bg-secondary/5"
                        >
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
                                      {folders.find(
                                        (f) => f.id === folder.parent_id
                                      )?.name || "Parent Folder"}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-primary/5"
                                >
                                  Bookmark Folder
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
                  <div className="text-sm text-muted-foreground">
                    Total Uses
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">
                    {linkedBookmarks?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Linked Conversations
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">
                    {linkedFolders?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Linked Bookmark Folders
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preferred Platforms Display */}
            {preferredPlatforms.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-medium mb-3">Preferred Platforms</h4>
                  <div className="flex flex-wrap gap-2">
                    {preferredPlatforms.map((platform) => (
                      <Badge
                        key={platform}
                        variant="outline"
                        className="bg-blue-500/10 text-blue-700 border-blue-500/30"
                      >
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="border border-dashed rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2">Usage Analytics</h3>
              <p className="text-muted-foreground mb-6">
                Detailed usage analytics are coming soon!
              </p>
              <p className="text-sm text-muted-foreground">
                Track which prompts generate the best responses and how often
                you use each prompt.
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
              Are you sure you want to delete this prompt? This action cannot be
              undone.
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
