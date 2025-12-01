'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { UserButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MainPage from './components/MainPage';
import TeacherSidebar from './components/TeacherSidebar';
import TeacherWelcome from './components/TeacherWelcome';
import TeacherStats from './components/TeacherStats';

export default function TeacherDashboard() {
  
  return (
   
   <div className='w-full'>
   
    <TeacherStats/>
   </div>
  
  );
}
