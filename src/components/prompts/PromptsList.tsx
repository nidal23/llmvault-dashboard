// src/components/prompts/PromptsList.tsx - Enhanced with folder grouping
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Star,
  Clock,
  BarChart2,
  Filter,
  SortAsc,
  FolderTree,
  X,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash,
  FolderPlus,
  Grid3X3,
  List,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { usePromptsStore } from "@/lib/stores/usePromptsStore";
import { usePromptFoldersStore } from "@/lib/stores/usePromptFoldersStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Prompt, PromptFolderWithCount } from "@/lib/supabase/database.types";

type ViewMode = "grouped" | "flat";
type DisplayMode = "grid" | "list";

interface GroupedPrompts {
  [key: string]: {
    folder: PromptFolderWithCount | null; // null for "No Folder"
    prompts: Prompt[];
  };
}

const PromptsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { 
    prompts, 
    isLoading, 
    error, 
    toggleFavorite 
  } = usePromptsStore();
  
  const {
    folders: promptFolders,
    fetchFolders: fetchPromptFolders,
    createFolder,
    renameFolder,
    deleteFolder
  } = usePromptFoldersStore();
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("grid");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"updated_at" | "title" | "usage" | "created_at">("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Folder management state
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [isRenameFolderDialogOpen, setIsRenameFolderDialogOpen] = useState(false);
  const [isDeleteFolderDialogOpen, setIsDeleteFolderDialogOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch prompt folders when component mounts
  useEffect(() => {
    if (user) {
      fetchPromptFolders(user.id);
    }
  }, [user, fetchPromptFolders]);
  
  // Auto-expand all folders initially in grouped view
  useEffect(() => {
    if (viewMode === "grouped" && promptFolders.length > 0) {
      setExpandedFolders(new Set(promptFolders.map(f => f.id)));
    }
  }, [viewMode, promptFolders]);
  
  // Extract unique categories from prompts
  const categories = useMemo(() => 
    [...new Set(prompts.map(p => p.category).filter(Boolean))] as string[],
    [prompts]
  );
  
  // Filter and sort prompts
  const filteredAndSortedPrompts = useMemo(() => {
    return prompts
      .filter(prompt => {
        // Search filter
        const matchesSearch = 
          prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (prompt.description && prompt.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (prompt.content && prompt.content.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Category filter
        const matchesCategory = 
          selectedCategories.length === 0 || 
          (prompt.category && selectedCategories.includes(prompt.category));
        
        // Favorites filter
        const matchesFavorite = 
          !showFavoritesOnly || 
          prompt.is_favorite;
        
        return matchesSearch && matchesCategory && matchesFavorite;
      })
      .sort((a, b) => {
        // Handle null dates
        if (!a[sortBy] && !b[sortBy]) return 0;
        if (!a[sortBy]) return sortDirection === "asc" ? -1 : 1;
        if (!b[sortBy]) return sortDirection === "asc" ? 1 : -1;
        
        // Sort by selected field
        if (typeof a[sortBy] === "string" && typeof b[sortBy] === "string") {
          return sortDirection === "asc" 
            ? a[sortBy].localeCompare(b[sortBy])
            : b[sortBy].localeCompare(a[sortBy]);
        }
        
        // For numeric values
        return sortDirection === "asc" 
          ? Number(a[sortBy]) - Number(b[sortBy])
          : Number(b[sortBy]) - Number(a[sortBy]);
      });
  }, [prompts, searchQuery, selectedCategories, showFavoritesOnly, sortBy, sortDirection]);
  
  // Group prompts by folder
  const groupedPrompts = useMemo((): GroupedPrompts => {
    const groups: GroupedPrompts = {};
    
    // Initialize groups for all folders (even empty ones)
    promptFolders.forEach(folder => {
      groups[folder.id] = {
        folder,
        prompts: []
      };
    });
    
    // Add group for prompts without folders
    groups['no-folder'] = {
      folder: null,
      prompts: []
    };
    
    // Distribute prompts into groups
    filteredAndSortedPrompts.forEach(prompt => {
      const groupKey = prompt.folder_id || 'no-folder';
      if (groups[groupKey]) {
        groups[groupKey].prompts.push(prompt);
      }
    });
    
    // Remove empty groups (except "no-folder" if it has prompts)
    Object.keys(groups).forEach(key => {
      if (groups[key].prompts.length === 0 && key !== 'no-folder') {
        delete groups[key];
      }
    });
    
    // Remove "no-folder" if it's empty
    if (groups['no-folder']?.prompts.length === 0) {
      delete groups['no-folder'];
    }
    
    return groups;
  }, [filteredAndSortedPrompts, promptFolders]);
  
  // Toggle folder expansion
  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };
  
  // Folder management handlers
  const handleCreateFolder = async () => {
    if (!user || !folderName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createFolder(user.id, folderName.trim(), null);
      setIsNewFolderDialogOpen(false);
      setFolderName("");
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRenameFolder = async () => {
    if (!user || !activeFolderId || !folderName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await renameFolder(user.id, activeFolderId, folderName.trim());
      setIsRenameFolderDialogOpen(false);
      setFolderName("");
      setActiveFolderId(null);
    } catch (error) {
      console.error('Error renaming folder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteFolder = async () => {
    if (!user || !activeFolderId) return;
    
    setIsSubmitting(true);
    try {
      await deleteFolder(user.id, activeFolderId);
      setIsDeleteFolderDialogOpen(false);
      setActiveFolderId(null);
    } catch (error) {
      console.error('Error deleting folder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openRenameDialog = (folderId: string, currentName: string) => {
    setActiveFolderId(folderId);
    setFolderName(currentName);
    setIsRenameFolderDialogOpen(true);
  };
  
  const openDeleteDialog = (folderId: string) => {
    setActiveFolderId(folderId);
    setIsDeleteFolderDialogOpen(true);
  };
  
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const handleCreatePrompt = (folderId?: string) => {
    const createUrl = folderId 
      ? `/prompts/new?folder=${folderId}`
      : '/prompts/new';
    navigate(createUrl);
  };
  
  const handleEditPrompt = (id: string) => {
    navigate(`/prompts/${id}`);
  };
  
  const handleToggleFavorite = (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    toggleFavorite(promptId);
  };

  
  // Render individual prompt card
  const renderPromptCard = (prompt: Prompt) => {
    
    return (
      <motion.div
        key={prompt.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        onClick={() => handleEditPrompt(prompt.id)}
      >
        <Card className={cn(
          "cursor-pointer hover:border-primary/50 transition-all duration-200",
          displayMode === "list" ? "flex flex-row items-center p-4" : "h-full"
        )}>
          {displayMode === "grid" ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-1 text-base">{prompt.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 shrink-0",
                      prompt.is_favorite ? 'text-amber-500' : 'text-muted-foreground'
                    )}
                    onClick={(e) => handleToggleFavorite(e, prompt.id)}
                  >
                    <Star className="h-4 w-4" fill={prompt.is_favorite ? "currentColor" : "none"} />
                  </Button>
                </div>
                {prompt.description && (
                  <CardDescription className="line-clamp-2 text-xs">
                    {prompt.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="pb-3">
                <div className="text-sm line-clamp-2 mb-3 text-muted-foreground">
                  {prompt.content.substring(0, 100)}
                  {prompt.content.length > 100 && "..."}
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {prompt.category && (
                    <Badge variant="outline" className="text-xs bg-primary/5 text-primary">
                      {prompt.category}
                    </Badge>
                  )}
                  
                  {prompt.tags && prompt.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs bg-secondary/10">
                      #{tag}
                    </Badge>
                  ))}
                  
                  {prompt.tags && prompt.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs bg-secondary/10">
                      +{prompt.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {prompt.updated_at 
                      ? formatDistanceToNow(new Date(prompt.updated_at), { addSuffix: true })
                      : "Never"
                    }
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <BarChart2 className="h-3 w-3" />
                  <span>{prompt.usage || 0}</span>
                </div>
              </CardFooter>
            </>
          ) : (
            /* List view */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{prompt.title}</h3>
                    {prompt.is_favorite && (
                      <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
                    )}
                  </div>
                  {prompt.description && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {prompt.description}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {prompt.category && (
                    <Badge variant="outline" className="text-xs">
                      {prompt.category}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BarChart2 className="h-3 w-3" />
                  <span>{prompt.usage || 0}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {prompt.updated_at 
                      ? formatDistanceToNow(new Date(prompt.updated_at), { addSuffix: true })
                      : "Never"
                    }
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => handleToggleFavorite(e, prompt.id)}
                >
                  <Star className="h-4 w-4" fill={prompt.is_favorite ? "currentColor" : "none"} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Loading prompts...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center py-8 text-destructive">
        <p>Error loading prompts: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with search and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-background"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "grouped" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grouped")}
              className="h-8"
            >
              <FolderTree className="h-4 w-4 mr-1" />
              Grouped
            </Button>
            <Button
              variant={viewMode === "flat" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("flat")}
              className="h-8"
            >
              <List className="h-4 w-4 mr-1" />
              Flat
            </Button>
          </div>
          
          {/* Display Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={displayMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDisplayMode("grid")}
              className="h-8"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={displayMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDisplayMode("list")}
              className="h-8"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
                {(selectedCategories.length > 0 || showFavoritesOnly) && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {selectedCategories.length + (showFavoritesOnly ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuCheckboxItem
                checked={showFavoritesOnly}
                onCheckedChange={setShowFavoritesOnly}
              >
                Favorites only
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              
              <div className="px-2 py-1.5 text-sm font-semibold">Categories</div>
              {categories.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories yet</div>
              ) : (
                categories.map(category => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                <span>Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={`${sortBy}-${sortDirection}`}>
                <DropdownMenuRadioItem 
                  value="updated_at-desc"
                  onClick={() => { setSortBy("updated_at"); setSortDirection("desc"); }}
                >
                  Latest Updated
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem 
                  value="created_at-desc"
                  onClick={() => { setSortBy("created_at"); setSortDirection("desc"); }}
                >
                  Recently Created
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem 
                  value="title-asc"
                  onClick={() => { setSortBy("title"); setSortDirection("asc"); }}
                >
                  Name A-Z
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem 
                  value="usage-desc"
                  onClick={() => { setSortBy("usage"); setSortDirection("desc"); }}
                >
                  Most Used
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Folder Management */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Folders
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsNewFolderDialogOpen(true)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => handleCreatePrompt()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New Prompt</span>
          </Button>
        </div>
      </div>
      
      {/* Active Filters Display */}
      {(selectedCategories.length > 0 || showFavoritesOnly) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {selectedCategories.map(category => (
            <Badge key={category} variant="outline" className="flex items-center gap-1">
              <span>{category}</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => handleCategoryToggle(category)}
              />
            </Badge>
          ))}
          
          {showFavoritesOnly && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>Favorites</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => setShowFavoritesOnly(false)}
              />
            </Badge>
          )}
        </div>
      )}
      
      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredAndSortedPrompts.length === prompts.length 
          ? `${prompts.length} prompt${prompts.length !== 1 ? 's' : ''}`
          : `${filteredAndSortedPrompts.length} of ${prompts.length} prompts`
        }
        {viewMode === "grouped" && Object.keys(groupedPrompts).length > 0 && (
          <span> across {Object.keys(groupedPrompts).length} folder{Object.keys(groupedPrompts).length !== 1 ? 's' : ''}</span>
        )}
      </div>
      
      {/* Content */}
      {filteredAndSortedPrompts.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <h3 className="text-xl font-medium mb-2">No prompts found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || selectedCategories.length > 0 || showFavoritesOnly
              ? "Try adjusting your filters or search query" 
              : "Create your first prompt to get started"
            }
          </p>
          
          <Button onClick={() => handleCreatePrompt()}>
            Create your first prompt
          </Button>
        </div>
      ) : viewMode === "grouped" ? (
        /* Grouped View */
        <div className="space-y-6">
          <AnimatePresence>
            {Object.entries(groupedPrompts).map(([groupKey, group]) => {
              const isExpanded = expandedFolders.has(groupKey);
              const folderName = group.folder?.name || "Uncategorized";
              const promptCount = group.prompts.length;
              
              return (
                <motion.div
                  key={groupKey}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Folder Header */}
                  <div 
                    className="bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleFolderExpansion(groupKey)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <div className="flex items-center gap-2">
                          <FolderTree className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-medium">{folderName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {promptCount} prompt{promptCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreatePrompt(group.folder?.id);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Prompt
                        </Button>
                        
                        {group.folder && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openRenameDialog(group.folder!.id, group.folder!.name)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Rename Folder
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(group.folder!.id)}
                                className="text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete Folder
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Folder Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4">
                          <div className={cn(
                            displayMode === "grid" 
                              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                              : "space-y-2"
                          )}>
                            {group.prompts.map(prompt => renderPromptCard(prompt))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Flat View */
        <div className={cn(
          displayMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-3"
        )}>
          <AnimatePresence>
            {filteredAndSortedPrompts.map(prompt => renderPromptCard(prompt))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Dialogs */}
      
      {/* New Folder Dialog */}
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your prompts.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folder-name" className="text-right">
                Name
              </Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsNewFolderDialogOpen(false);
                setFolderName("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFolder}
              disabled={isSubmitting || !folderName.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rename Folder Dialog */}
      <Dialog open={isRenameFolderDialogOpen} onOpenChange={setIsRenameFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for this folder.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rename-folder-name" className="text-right">
                Name
              </Label>
              <Input
                id="rename-folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRenameFolderDialogOpen(false);
                setFolderName("");
                setActiveFolderId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRenameFolder}
              disabled={isSubmitting || !folderName.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Folder Dialog */}
      <Dialog open={isDeleteFolderDialogOpen} onOpenChange={setIsDeleteFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this folder? This action cannot be undone.
              All prompts in this folder will be moved to "Uncategorized".
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteFolderDialogOpen(false);
                setActiveFolderId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteFolder}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptsList;