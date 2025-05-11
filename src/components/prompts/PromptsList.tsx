// src/components/prompts/PromptsList.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Star,
  Clock,
  BarChart2,
  ExternalLink,
  Filter,
  SortAsc,
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
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { usePromptsStore } from "@/lib/stores/usePromptsStore";
// import { Prompt } from "@/lib/supabase/database.types";
import { formatDistanceToNow } from "date-fns";

const PromptsList = () => {
  const navigate = useNavigate();
  const { 
    prompts, 
    isLoading, 
    error, 
    // fetchPrompts, 
    toggleFavorite 
  } = usePromptsStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"updated_at" | "title" | "usage" | "created_at">("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Extract unique categories from prompts
const categories = [...new Set(prompts.map(p => p.category).filter(Boolean))] as string[];
  
  // Filter and sort prompts
  const filteredPrompts = prompts
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
  
  const handleToggleSort = (field: "updated_at" | "title" | "usage" | "created_at") => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };
  
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const handleCreatePrompt = () => {
    navigate("/prompts/new");
  };
  
  const handleEditPrompt = (id: string) => {
    navigate(`/prompts/${id}`);
  };
  
  const handleToggleFavorite = (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    toggleFavorite(promptId);
  };
  
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };
  
  return (
    <div className="space-y-6">
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
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                <span>Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleToggleSort("updated_at")}>
                Last Updated {getSortIcon("updated_at")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleSort("created_at")}>
                Date Created {getSortIcon("created_at")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleSort("title")}>
                Title {getSortIcon("title")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleSort("usage")}>
                Usage Count {getSortIcon("usage")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleCreatePrompt} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New Prompt</span>
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Loading prompts...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center py-8 text-destructive">
          <p>Error loading prompts: {error}</p>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <h3 className="text-xl font-medium mb-2">No prompts found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || selectedCategories.length > 0 || showFavoritesOnly 
              ? "Try adjusting your filters or search query" 
              : "Create your first prompt to get started"
            }
          </p>
          
          <Button onClick={handleCreatePrompt}>
            Create your first prompt
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map(prompt => (
            <motion.div
              key={prompt.id}
              whileHover={{ y: -5 }}
              onClick={() => handleEditPrompt(prompt.id)}
            >
              <Card className="h-full cursor-pointer hover:border-primary/50 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-1">{prompt.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${prompt.is_favorite ? 'text-amber-500' : 'text-muted-foreground'}`}
                      onClick={(e) => handleToggleFavorite(e, prompt.id)}
                    >
                      <Star className="h-5 w-5" fill={prompt.is_favorite ? "currentColor" : "none"} />
                    </Button>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {prompt.description || "No description"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pb-3">
                  <div className="text-sm line-clamp-3 mb-3">
                    {prompt.content.substring(0, 150)}
                    {prompt.content.length > 150 && "..."}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {prompt.category && (
                      <Badge variant="outline" className="bg-primary/5 text-primary">
                        {prompt.category}
                      </Badge>
                    )}
                    
                    {prompt.tags && prompt.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="bg-secondary/10">
                        #{tag}
                      </Badge>
                    ))}
                    
                    {prompt.tags && prompt.tags.length > 3 && (
                      <Badge variant="outline" className="bg-secondary/10">
                        +{prompt.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between text-xs text-muted-foreground pt-3 border-t">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {prompt.updated_at 
                        ? formatDistanceToNow(new Date(prompt.updated_at), { addSuffix: true })
                        : "Never updated"
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <BarChart2 className="h-3.5 w-3.5" />
                      <span>Used {prompt.usage || 0} times</span>
                    </div>
                    
                    <div className="w-px h-3 bg-muted-foreground/30"></div>
                    
                    <div className="flex items-center gap-1">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Use</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromptsList;