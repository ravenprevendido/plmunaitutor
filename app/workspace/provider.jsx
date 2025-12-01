import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import React, { useState } from 'react'
import AppSidebar from './_components/AppSidebar'
import AppHeader from './_components/AppHeader'
import { ThemeProvider } from './_components/ThemeProvider'

function WorkspaceProvider({  children }) {
  
  
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppSidebar />
        <div className='w-full bg-white dark:bg-[#0D1117] min-h-screen'>
          <AppHeader/>
          <main className='flex-1'></main>
          <div className='p-10'>
            {children}
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}



export default WorkspaceProvider


