"use client"
import React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Image from 'next/image';
import { Book, Compass, LayoutDashboard, PencilRulerIcon} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SideBarOptions=[
  {
    title: 'Dashboard',
    icon:LayoutDashboard,
    path: '/workspace'
  },
  {
    title: 'My courses',
    icon:Book,
    path: '/workspace/my-courses'
  },
  {
    title: 'Lessons & materials',
    icon:Book,
    path: '/workspace/lesson-materials'
  },
  {
    title: 'Quizzes & Assessment',
    icon:PencilRulerIcon,
    path: '/workspace/quizzes-assessment'
  },
  {
    title: 'Study plan',
    icon:Book,
    path: '/workspace/study-plan'
  },
  {
    title: 'Analytics',
    icon:Compass,
    path: '/workspace/analytics'
  },
  {
    title: 'AI tutor',
    icon:PencilRulerIcon,
    path: '/workspace/ai-tutor'
  }
]

function AppSidebar() {
  const path = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  
  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (itemPath) => {
    if (itemPath === '/workspace') {
      return path === '/workspace';
    }
    return path.startsWith(itemPath);
  };

  return (
    <Sidebar data-sidebar="true" className="sidebar">
      <SidebarHeader className={'p-4 bg-white dark:bg-[#0D1117] border-b border-gray-200 dark:border-gray-800'}>
        <div className="flex items-center justify-start md:justify-start">
          <Image
            src="/plmunlogo.png"
            alt="logo"
            width={70}
            height={70}
            className="mx-auto md:mx-0"
          />
          <span className="ml-2 text-lg font-semibold hidden md:inline-block ">
            <span className="text-gray-900 dark:text-white" > PLMun AI Tutor </span>
          </span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-white dark:bg-[#0D1117]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SideBarOptions.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild className={'p-5 hover:bg-gray-100 dark:hover:bg-[#161B22]'}>
                    <Link  
                      href={item.path} 
                      onClick={handleLinkClick}
                      className={`text-[15px] text-gray-700 dark:text-white ${isActive(item.path) ? 'text-green-600 dark:text-green-400 font-semibold' : ''}`}
                    >
                      <item.icon className='h-7 w-7' />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="bg-white dark:bg-[#0D1117] border-t border-gray-200 dark:border-gray-800"/>
    </Sidebar>
  )
}

export default AppSidebar