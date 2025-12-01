import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserButton } from '@clerk/nextjs';
import React, { useEffect, useRef, useState } from 'react'
import { IoNotifications } from 'react-icons/io5';

const MainPage = () => {
   
   const [showNotif, setShowNotif] = useState(false);
   const notifRef = useRef(null);
      
      useEffect(() => {
          const handleClickOutside = (event) => {
              if(notifRef.current && !notifRef.current.contains(event.target)){
                  setShowNotif(false);
              }
          }
          document.addEventListener("mousedown", handleClickOutside)
          return () => {
              document.removeEventListener("mousedown", handleClickOutside )
          }
      }, [])
      return (
          <div className='p-4 flex justify-between items-center shadow-sm'>
              <SidebarTrigger className='text-green-400'/> <span className='md:hidden visible text-white text-1xl'><span className='text-green-500'>PLMun</span> <span className='text-gray-300'> AI - Tutor</span> </span>
              <div className='relative flex items-center gap-3 ml-auto'>
  
              <div onClick={() => setShowNotif(!showNotif)}>
              <IoNotifications className='text-white hover:text-green-500 md:w-5' />
              </div>
              {/* show notif modal */}
              {showNotif && (
                  <div className='absolute right-15 top-10  text-white bg-[#161B22] rounded-xl shadow-lg w-54 p-3 z-50 border border-gray-700 animate-collapsible-down'>
                      <p className='font-semibold mb-2 text-sm text-green-400'>🔔 Notification</p>
                      <ul className='space-y-2 text-sm'>
                          <li className='bg-[#0d1117] p-2 text-sm hover:bg-[#1E242B] transition'>New Course "Ai Fundamentals" is now available!</li>
                          <li className='bg-[#0d1117] p-2 rounded-lg hover:bg-[#1E242B] transition'>You completed 3 Lesson today 🎉</li>
                          <li className='bg-[#0d1117] p-2 rounded-lg hover:bg-[#1E242B] transition'>Quiz results are ready to view</li>
                      </ul>
                  </div>
              )}
              <UserButton  />
              </div>
          </div>
      )   
  }

export default MainPage
