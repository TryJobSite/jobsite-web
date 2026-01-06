'use client';

import { CreateJobButton } from './create-job-button';

// This component will be used by the layout
// The page will set up a global handler via window events or a simpler pattern
export function JobsHeaderAction() {
  const handleClick = () => {
    // Dispatch a custom event that the page can listen to
    window.dispatchEvent(new CustomEvent('openCreateJobDialog'));
  };

  return <CreateJobButton onClick={handleClick} />;
}
