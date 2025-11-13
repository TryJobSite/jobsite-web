'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Small delay to ensure the session is saved
    const timer = setTimeout(() => {
      // Check if we're in a popup window
      if (window.opener) {
        // Send success message to parent window
        window.opener.postMessage('oauth-success', window.location.origin);
        // Close the popup after a brief delay
        setTimeout(() => {
          window.close();
        }, 100);
      } else {
        // If not in popup, redirect to home
        window.location.href = '/';
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p>Completing sign in...</p>
        <p className="mt-2 text-sm text-gray-500">This window will close automatically.</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
