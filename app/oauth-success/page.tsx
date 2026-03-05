'use client';
import { useEffect } from 'react';

export default function OAuthSuccess() {
  useEffect(() => {
    window.close();
  }, []);

  return null;
}
