'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TeacherSidebar from './components/TeacherSidebar';
import TeacherHeader from './components/TeacherHeader';
import MainPage from './components/MainPage';

export default function TeacherLayout({ children }) {
  
  return (
    <SidebarProvider>
      <div className="flex w-full   h-screen bg-[#0D1117]">
        <TeacherSidebar />
        <div className="flex-1 flex flex-col min-w-0"> {/* Added min-w-0 for proper flex constraint */}
          <TeacherHeader />
          <main className="flex-1 overflow-auto">
            <div className="w-full"> {/* Ensure full width container */}
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}