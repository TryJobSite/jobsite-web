'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/(components)/shadcn/ui/dialog';
import { Button } from '@/(components)/shadcn/ui/button';
import { Download, X } from 'lucide-react';

type Document = {
  clientUploadId: string;
  fileName: string;
  fileType: string;
  documentUrl: string;
  notes: string | null;
};

type DocumentViewerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  onDownload: (documentUrl: string, fileName: string) => void;
};

const isImageType = (fileType: string): boolean => {
  return fileType.startsWith('image/');
};

const isPdfType = (fileType: string): boolean => {
  return fileType === 'application/pdf' || fileType === 'application/x-pdf';
};

export function DocumentViewerModal({ open, onOpenChange, document, onDownload }: DocumentViewerModalProps) {
  if (!document) return null;

  const isImage = isImageType(document.fileType);
  const isPdf = isPdfType(document.fileType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="pr-4">{document.fileName}</DialogTitle>
              <DialogDescription className="mt-1">
                {document.fileType}
                {document.notes && <span className="ml-2">• {document.notes}</span>}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(document.documentUrl, document.fileName)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-4 max-h-[calc(90vh-120px)] overflow-auto">
          {isImage ? (
            <div className="flex items-center justify-center bg-slate-50 p-4">
              <img
                src={document.documentUrl}
                alt={document.fileName}
                className="max-h-[calc(90vh-200px)] max-w-full object-contain"
              />
            </div>
          ) : isPdf ? (
            <div className="h-[calc(90vh-200px)] w-full">
              <iframe
                src={document.documentUrl}
                className="h-full w-full border-0"
                title={document.fileName}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="mb-4 text-slate-600">
                Preview not available for this file type. Please download to view.
              </p>
              <Button onClick={() => onDownload(document.documentUrl, document.fileName)}>
                <Download className="mr-2 h-4 w-4" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
