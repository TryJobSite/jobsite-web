'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import { Plus, Trash2, Download, File, Eye } from 'lucide-react';
import { formatDate } from './utils';

type Document = {
  clientUploadId: string;
  jobId: string;
  s3Path: string;
  fileName: string;
  fileType: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  documentUrl: string;
};

type DocumentsCardProps = {
  isLoading: boolean;
  documents: Document[] | undefined;
  onUpload: () => void;
  onDelete: (clientUploadId: string) => void;
  onDownload: (documentUrl: string, fileName: string) => void;
  onView: (document: Document) => void;
};

export function DocumentsCard({
  isLoading,
  documents,
  onUpload,
  onDelete,
  onDownload,
  onView,
}: DocumentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Documents</CardTitle>
          <Button onClick={onUpload} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-slate-500">Loading documents...</div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.clientUploadId}
                className="flex items-center justify-between rounded-md border border-slate-200 p-4"
              >
                <div className="flex flex-1 items-center gap-4">
                  <div className="flex-shrink-0">
                    <File className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-900">{document.fileName}</div>
                    <div className="text-sm text-slate-500">
                      {document.fileType} • {formatDate(document.createdAt)}
                    </div>
                    {document.notes && <div className="mt-1 text-sm text-slate-600">{document.notes}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => onView(document)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownload(document.documentUrl, document.fileName)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(document.clientUploadId)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="mb-4 text-slate-500">No documents have been uploaded yet.</p>
            <Button onClick={onUpload}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
