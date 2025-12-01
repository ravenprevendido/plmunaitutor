// hooks/useAdminShortcut.js
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAdminShortcut() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Ctrl + A shortcut
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        router.push('/admin');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [router]);
}

