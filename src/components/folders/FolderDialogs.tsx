import { memo } from "react";
import { Loader2 } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FolderWithCount } from "@/lib/supabase/database.types";

// New Folder Dialog Content
export const NewFolderDialogContent = memo(({
  folderName, 
  setFolderName, 
  parentFolderId, 
  setParentFolderId,
  handleCreateFolder,
  onClose,
  isSubmitting,
  isFetching,
  visibleFolders
}: {
  folderName: string;
  setFolderName: (name: string) => void;
  parentFolderId: string | null;
  setParentFolderId: (id: string | null) => void;
  handleCreateFolder: () => void;
  onClose: () => void;
  isSubmitting: boolean;
  isFetching: boolean;
  visibleFolders: FolderWithCount[];
}) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>New Folder</DialogTitle>
        <DialogDescription>
          Create a new folder to organize your conversations.
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
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="parent-folder" className="text-right">
            Parent
          </Label>
          <div className="col-span-3">
            <select
              id="parent-folder"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              value={parentFolderId || ""}
              onChange={(e) => setParentFolderId(e.target.value || null)}
            >
              <option value="">None (Root folder)</option>
              {visibleFolders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          onClick={handleCreateFolder}
          disabled={isSubmitting || isFetching}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : 'Create Folder'}
        </Button>
      </DialogFooter>
    </>
  );
});

// Edit Folder Dialog Content
export const EditFolderDialogContent = memo(({
  folderName, 
  setFolderName, 
  handleEditFolder,
  onClose,
  isSubmitting,
  isFetching
}: {
  folderName: string;
  setFolderName: (name: string) => void;
  handleEditFolder: () => void;
  onClose: () => void;
  isSubmitting: boolean;
  isFetching: boolean;
}) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Folder</DialogTitle>
        <DialogDescription>
          Update the folder name.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-folder-name" className="text-right">
            Name
          </Label>
          <Input
            id="edit-folder-name"
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
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          onClick={handleEditFolder}
          disabled={isSubmitting || isFetching}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : 'Save Changes'}
        </Button>
      </DialogFooter>
    </>
  );
});

// Delete Folder Dialog
export const DeleteFolderDialog = ({
  open,
  onOpenChange,
  folderName,
  hasBookmarks,
  onDelete,
  onCancel,
  isSubmitting,
  isFetching
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  hasBookmarks: boolean;
  onDelete: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isFetching: boolean;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Delete Folder</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the folder "{folderName}"? This action cannot be undone.
            
            {hasBookmarks && (
              <div className="mt-2 text-destructive">
                Warning: This folder contains conversations that will also be deleted.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onDelete}
            disabled={isSubmitting || isFetching}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Exported combined dialogs
export const FolderDialogs = {
  NewFolderDialogContent,
  EditFolderDialogContent,
  DeleteFolderDialog
};