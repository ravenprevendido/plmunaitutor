// app/provider.jsx - FIXED VERSION
'use client';
import { useUser, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserDetailContext } from '@/context/UserDetailContext';
import toast from 'react-hot-toast';

const Provider = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken, signOut } = useAuth();
  const [userDetail, setUserDetail] = useState();
  const [hasHandledRedirect, setHasHandledRedirect] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    
    if (!isLoaded) return;
    
    // Don't redirect if user is on dedicated auth pages - let them complete signup/signin first
    const isDedicatedAuthPage = pathname?.includes('/sign-in') || pathname?.includes('/sign-up');
    if (isDedicatedAuthPage) {
      return;
    }
    
    if (isSignedIn && user && !hasHandledRedirect) {
      handleUserRedirect();

      // add delay timer
      const timer = setTimeout(() => {
        handleUserRedirect();
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isLoaded, isSignedIn, user, pathname, hasHandledRedirect]);

  const handleUserRedirect = async () => {
    try {
      setHasHandledRedirect(true);
      
      // STEP 1: Get CORRECT role (check localStorage first)
      let pendingRole = null;
      try {
        pendingRole = localStorage.getItem('pendingRole');
      } catch (e) {
        pendingRole = null;
      }
      const userData = {
        id: user.id,
        name: user.fullName,
        email: user.primaryEmailAddress?.emailAddress,
        clerk_id: user.id,
        role: pendingRole // ✅ Use pendingRole, NOT hardcoded 'student'
      };

      // STEP 2: Sync to database
      const apiResponse = await syncUserToDatabase(userData);

      // Check if API call failed (returned null) - user will be signed out
      if (!apiResponse) {
        console.error("❌ Account creation/validation failed, user signed out");
        return; // Exit early, user is already signed out
      }

      // STEP 3: Use the role from API response (which has the correct role from database)
      const finalRole = apiResponse?.role || pendingRole || 'student';

      // Store userDetail with isNewUser flag for AuthWatcher
      setUserDetail(apiResponse);

      // Clean up
      try {
        localStorage.removeItem('pendingRole');
      } catch (e) {}

      // REDIRECT
      if (finalRole === 'teacher') {
        router.replace('/teacher');
      } else {
        router.replace('/workspace');
      }
      
    } catch (error) {
      console.error("❌ Error in redirect:", error);
      router.replace('/workspace');
    }
  };

  const syncUserToDatabase = async (userData) => {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add flag to indicate if this is a new signup (201) or sign-in (200)
        const isNewUser = response.status === 201;
        return { ...result, isNewUser }; // RETURN THE API RESPONSE WITH FLAG
      } else {
        // Handle error response
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || 'Failed to create account';
        console.error("❌ API call failed:", errorMessage);
        
        // Display error message to user with toast notification
        toast.error(errorMessage, {
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '2px solid #ef4444',
            borderRadius: '12px',
            padding: '16px 20px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)',
            maxWidth: '400px',
          },
          icon: '⚠️',
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        });
        
        // Sign out the user immediately since they can't proceed with this account
        if (signOut) {
          await signOut();
        }
        
        // Return null to indicate failure
        return null;
      }
    } catch (error) {
      console.error("❌ Failed to sync user:", error);
      
      // Display error message to user with toast notification
      toast.error("An error occurred while creating your account. Please try again.", {
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#1f2937',
          color: '#fff',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '16px 20px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)',
          maxWidth: '400px',
        },
        icon: '⚠️',
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff',
        },
      });
      
      // Sign out on error
      if (signOut) {
        await signOut().catch(console.error);
      }
      
      return null;
    }
  };

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <div className="bg-black">{children}</div>
    </UserDetailContext.Provider>
  );
};

export default Provider;

