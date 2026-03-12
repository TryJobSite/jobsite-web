'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { formatDate } from './utils';

type JobPhoto = {
  clientUploadId: string;
  jobId: string;
  fileName: string;
  fileType: string;
  notes: string | null;
  createdAt: string;
  documentUrl: string;
};

type JobPhotosCardProps = {
  isLoading: boolean;
  photos: JobPhoto[] | undefined;
  onUpload: () => void;
  onDelete: (clientUploadId: string) => void;
};

export function JobPhotosCard({ isLoading, photos, onUpload, onDelete }: JobPhotosCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Job Photos</CardTitle>
          <Button onClick={onUpload} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Upload Job Photo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-slate-500">Loading photos...</div>
        ) : photos && photos.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {photos.map((photo) => (
              <div key={photo.clientUploadId} className="flex flex-col gap-2">
                <div className="group relative">
                  <img
                    src={photo.documentUrl}
                    alt={photo.fileName}
                    style={{ maxWidth: '200px' }}
                    className="rounded-md border border-slate-200 object-cover"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(photo.clientUploadId)}
                    className="absolute top-1 right-1 h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100
                      text-red-600 hover:bg-red-50 hover:text-red-700 bg-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="max-w-[200px]">
                  <div className="truncate text-xs text-slate-500">{formatDate(photo.createdAt)}</div>
                  {photo.notes && <div className="mt-0.5 text-xs text-slate-600">{photo.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="mb-4 text-slate-500">No photos have been uploaded yet.</p>
            <Button onClick={onUpload}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Job Photo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
