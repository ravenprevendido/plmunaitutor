// components/AdminShortcutProvider.jsx
'use client';
import { useAdminShortcut } from '@/hooks/useAdminShortcut';

export default function AdminShortcutProvider({ children }) {
  useAdminShortcut();
  
  return <>{children}</>;
}