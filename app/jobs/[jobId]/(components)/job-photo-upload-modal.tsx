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

type PhotoUploadFormData = {
  fileName: string;
  fileType: string;
  fileData: string;
  notes?: string | null;
};

type JobPhotoUploadModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  photoForm: UseFormReturn<PhotoUploadFormData>;
  onSubmit: (data: PhotoUploadFormData) => Promise<void>;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
};

export function JobPhotoUploadModal({
  open,
  onOpenChange,
  isSubmitting,
  photoForm,
  onSubmit,
  onFileSelect,
  selectedFile,
}: JobPhotoUploadModalProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        const base64Data = base64String.split(',')[1] || base64String;
        photoForm.setValue('fileData', base64Data);
        photoForm.setValue('fileName', file.name);
        photoForm.setValue('fileType', file.type || 'image/jpeg');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Job Photo</DialogTitle>
          <DialogDescription>Upload a photo for this job.</DialogDescription>
        </DialogHeader>
        <form onSubmit={photoForm.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="photo-file" className="text-sm font-medium">
              Photo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="photo-file"
              type="file"
              accept="image/*"
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
            <Label htmlFor="photo-notes" className="text-sm font-medium">
              Notes
            </Label>
            <textarea
              id="photo-notes"
              {...photoForm.register('notes')}
              className="mt-2 flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2
                text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Additional notes about this photo..."
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
