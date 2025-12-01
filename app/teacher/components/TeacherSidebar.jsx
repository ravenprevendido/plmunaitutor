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
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBook } from 'react-icons/fa';
import { IoAnalytics } from 'react-icons/io5';
import { LayoutDashboard } from 'lucide-react';

const SideBarOptions = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/teacher'
  },
  {
    title: 'My courses',
    icon: FaBook,
    path: '/teacher/course'
  },
  {
    title: 'Analytics',
    icon: IoAnalytics,
    path: '/teacher/analytics'
  },

]

function TeacherSidebar() {
  const { toggle } = useSidebar();
  const pathname = usePathname();

  

  const isActive = (path) => {
    if (path === '/teacher') {
      return pathname === '/teacher';
    }
    return pathname.startsWith(path);
  };

  return (
    <Sidebar>
      <SidebarHeader className={'p-4 bg-[#0D1117]'}>
        <div className="flex items-center justify-start md:justify-start">
          <Image
            src="/plmunlogo.png"
            alt="logo"
            width={70}
            height={70}
            className="mx-auto md:mx-0"
          />
          <span className="ml-2 text-lg font-semibold hidden md:inline-block">
            <span className="text-white">PLMun AI Tutor</span>
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-[#0D1117]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SideBarOptions.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild className={'p-5'}>
                    <Link 
                      href={item.path} 
                    
                      className={`text-[15px] text-white transition-colors hover:text-green-400 ${
                        isActive(item.path) ? 'text-green-400 bg-[#161B22]' : ''
                      }`}
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
      <SidebarFooter className='bg-[#0D1117]' />
    </Sidebar>
  )
}

export default TeacherSidebar