'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/(components)/shadcn/ui/dialog';
import { Button } from '@/(components)/shadcn/ui/button';
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';
import { UseFormReturn } from 'react-hook-form';

type DocumentUploadFormData = {
  fileName: string;
  fileType: string;
  fileData: string;
  notes?: string | null;
};

type DocumentUploadModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  documentForm: UseFormReturn<DocumentUploadFormData>;
  onSubmit: (data: DocumentUploadFormData) => Promise<void>;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
};

export function DocumentUploadModal({
  open,
  onOpenChange,
  isSubmitting,
  documentForm,
  onSubmit,
  onFileSelect,
  selectedFile,
}: DocumentUploadModalProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = base64String.split(',')[1] || base64String;
        documentForm.setValue('fileData', base64Data);
        documentForm.setValue('fileName', file.name);
        documentForm.setValue('fileType', file.type || 'application/octet-stream');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>Upload a document for this job.</DialogDescription>
        </DialogHeader>
        <form onSubmit={documentForm.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="doc-file" className="text-sm font-medium">
              File <span className="text-red-500">*</span>
            </Label>
            <Input
              id="doc-file"
              type="file"
              onChange={handleFileChange}
              className="mt-2"
              disabled={isSubmitting}
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-slate-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="doc-notes" className="text-sm font-medium">
              Notes
            </Label>
            <textarea
              id="doc-notes"
              {...documentForm.register('notes')}
              className="mt-2 flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2
                text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Additional notes about this document..."
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedFile || isSubmitting}>
              {isSubmitting ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
