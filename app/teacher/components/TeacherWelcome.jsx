import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'

const TeacherWelcome = () => {
    const {user, isLoaded} = useUser();
    const router = useRouter()
  
    useEffect(() => {
      if(isLoaded && !user)
        router.push('/')
    }, [isLoaded, user, router])
    const displayName = user?.fullName || 'Teacher';
  return (
        <div className='p-6 bg-linear-to-br md:w-full w-82 md:ml-0 -ml-6 from-green-700 via-green-900 to-green-500 rounded-xl mb-6'>
            <h2 className='font-bold text-2xl text-white'>Welcome Back, {displayName}</h2>
            <p className='text-white text-sm mt-1'>Here's your Learning progress today keep it up!</p>
        </div>
  )
}



export default TeacherWelcome
