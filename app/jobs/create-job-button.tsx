'use client';

import { Button } from '@/(components)/shadcn/ui/button';
import { Plus } from 'lucide-react';

export function CreateJobButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick}>
      <Plus className="mr-2 h-4 w-4" />
      Create Job
    </Button>
  );
}
