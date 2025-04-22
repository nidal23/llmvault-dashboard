import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FolderWithCount, PlatformWithColor } from "@/lib/supabase/database.types";
import TreeFolderSelector from "./TreeFolderSelector";

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderWithCount[];
  availablePlatforms: PlatformWithColor[];
  availableLabels: string[];
  currentFolderId?: string;
  onSubmit: (data: {
    url: string;
    title: string;
    folder_id: string;
    platform?: string | null;
    label?: string | null;
    notes?: string | null;
  }) => Promise<void>;
}

/**
 * Enhanced modal for adding a new bookmark with tree folder selection
 * and improved platform selection
 */
const AddBookmarkModal = ({
  isOpen,
  onClose,
  folders,
  availablePlatforms,
  availableLabels,
  currentFolderId,
  onSubmit
}: AddBookmarkModalProps) => {
  // Form state
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState(currentFolderId || (folders.length > 0 ? folders[0].id : ""));
  const [platform, setPlatform] = useState("");
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dropdown states
  const [isPlatformOpen, setIsPlatformOpen] = useState(false);
  const [isLabelOpen, setIsLabelOpen] = useState(false);
  
  // Get selected platform color
  const getPlatformColor = (platformName: string): string => {
    const platform = availablePlatforms.find(
      p => p.name.toLowerCase() === platformName.toLowerCase()
    );
    return platform?.color || "#808080";
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!url.trim() || !title.trim() || !folderId) {
      // Show error message
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        url,
        title,
        folder_id: folderId,
        platform: platform || null,
        label: label || null,
        notes: notes || null
      });
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error("Error submitting bookmark:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form state
  const resetForm = () => {
    setUrl("");
    setTitle("");
    setFolderId(currentFolderId || (folders.length > 0 ? folders[0].id : ""));
    setPlatform("");
    setLabel("");
    setNotes("");
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    resetForm();
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
      <DialogContent className="glass-card max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Bookmark</DialogTitle>
          <DialogDescription>
            Add a new bookmark to your collection.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">
              URL *
            </Label>
            <Input
              id="url"
              placeholder="https://chat.openai.com/..."
              className="col-span-3 dark:border-gray-700 dark:bg-gray-800/50"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title *
            </Label>
            <Input
              id="title"
              placeholder="My ChatGPT Conversation"
              className="col-span-3 dark:border-gray-700 dark:bg-gray-800/50"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          {/* Tree Folder Selector */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="folder" className="text-right">
              Folder *
            </Label>
            <div className="col-span-3">
              <TreeFolderSelector
                folders={folders}
                selectedFolderId={folderId}
                onSelect={setFolderId}
                className="dark:border-gray-700 dark:bg-gray-800/50"
                placeholder="Select a folder"
              />
            </div>
          </div>
          
          {/* Platform Selector with Color Indicators */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="platform" className="text-right">
              Platform
            </Label>
            <div className="col-span-3">
              <Popover open={isPlatformOpen} onOpenChange={setIsPlatformOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPlatformOpen}
                    className="w-full justify-between dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    {platform ? (
                      <div className="flex items-center">
                        <div 
                          className="h-3 w-3 rounded-full mr-2"
                          style={{ 
                            backgroundColor: getPlatformColor(platform) 
                          }}
                        />
                        <span>{platform}</span>
                      </div>
                    ) : (
                      "Select platform..."
                    )}
                    {platform && (
                      <X
                        className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlatform("");
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-full min-w-[220px]" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or enter new platform..."
                      value={platform}
                      onValueChange={setPlatform}
                      className="h-9"
                    />
                    <CommandEmpty>
                      {platform ? (
                        <div className="px-2 py-1.5 text-sm">
                          Press Enter to add "{platform}"
                        </div>
                      ) : (
                        <div className="px-2 py-1.5 text-sm">No platforms found</div>
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {availablePlatforms.length > 0 ? (
                        availablePlatforms.map((platform) => (
                          <CommandItem
                            key={platform.name}
                            value={platform.name}
                            onSelect={() => {
                              setPlatform(platform.name);
                              setIsPlatformOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center">
                              <div 
                                className="h-3 w-3 rounded-full mr-2"
                                style={{ backgroundColor: platform.color }}
                              />
                              {platform.name}
                            </div>
                          </CommandItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No platforms configured. Add them in settings.
                        </div>
                      )}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Label Selector */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="label" className="text-right">
              Label
            </Label>
            <div className="col-span-3">
              <Popover open={isLabelOpen} onOpenChange={setIsLabelOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isLabelOpen}
                    className="w-full justify-between dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    {label ? label : "Select or enter label..."}
                    {label && (
                      <X
                        className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLabel("");
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-full min-w-[220px]" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or enter new label..."
                      value={label}
                      onValueChange={setLabel}
                      className="h-9"
                    />
                    <CommandEmpty>
                      {label ? (
                        <div className="px-2 py-1.5 text-sm">
                          Press Enter to add "{label}"
                        </div>
                      ) : (
                        <div className="px-2 py-1.5 text-sm">No labels found</div>
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {availableLabels.length > 0 ? (
                        availableLabels.map((labelOption) => (
                          <CommandItem
                            key={labelOption}
                            value={labelOption}
                            onSelect={() => {
                              setLabel(labelOption);
                              setIsLabelOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            {labelOption}
                          </CommandItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No saved labels. Type to create one.
                        </div>
                      )}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Input
              id="notes"
              placeholder="Add notes about this bookmark"
              className="col-span-3 dark:border-gray-700 dark:bg-gray-800/50"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isSubmitting || !url.trim() || !title.trim() || !folderId}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : 'Create Bookmark'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookmarkModal;