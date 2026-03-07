import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEmailAttachments, EmailAttachment } from "@/hooks/useEmailAttachments";
import { Upload, Trash2, FileText, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";

// CLASS_TYPES now loaded dynamically via useClassTypes hook
import { useClassTypes } from "@/hooks/useClassTypes";

export function AttachmentLibrary() {
  const { attachments, isLoading, uploadAttachment, deleteAttachment, getAttachmentUrl } = useEmailAttachments();
  const { classTypeNames } = useClassTypes();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [classType, setClassType] = useState("all");
  const [attachmentToDelete, setAttachmentToDelete] = useState<EmailAttachment | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-set name from filename (without extension)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setAttachmentName(nameWithoutExt);
      setIsUploadOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !attachmentName.trim()) return;
    
    await uploadAttachment.mutateAsync({
      file: selectedFile,
      name: attachmentName.trim(),
      classType: classType === "all" ? undefined : classType,
    });
    
    // Reset form
    setSelectedFile(null);
    setAttachmentName("");
    setClassType("all");
    setIsUploadOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async () => {
    if (!attachmentToDelete) return;
    await deleteAttachment.mutateAsync(attachmentToDelete);
    setAttachmentToDelete(null);
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-8 w-8 text-muted-foreground" />;
    
    if (fileType.includes("pdf")) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (fileType.includes("word") || fileType.includes("document")) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else if (fileType.includes("image")) {
      return <FileText className="h-8 w-8 text-green-500" />;
    }
    return <FileText className="h-8 w-8 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Attachment Library</CardTitle>
            <CardDescription>
              Upload files to attach to emails (info packs, forms, etc.)
            </CardDescription>
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No attachments uploaded yet.</p>
            <p className="text-sm">Upload info packs, forms, or other files to attach to emails.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
              >
                {getFileIcon(attachment.file_type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{attachment.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {attachment.class_type && (
                      <Badge variant="secondary" className="text-xs">
                        {attachment.class_type}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(attachment.created_at), "dd MMM yyyy")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(getAttachmentUrl(attachment), "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setAttachmentToDelete(attachment)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Attachment</DialogTitle>
            <DialogDescription>
              Add a name and optional class type for this attachment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFile && (
              <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="e.g., EO Info Pack January 2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classType">Class Type (Optional)</Label>
              <Select value={classType} onValueChange={setClassType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classTypeNames.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Filter attachments by class type when sending emails
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!attachmentName.trim() || uploadAttachment.isPending}
            >
              {uploadAttachment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!attachmentToDelete} onOpenChange={() => setAttachmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{attachmentToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
