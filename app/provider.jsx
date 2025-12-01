// app/provider.jsx - FIXED VERSION
'use client';
import { useUser, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserDetailContext } from '@/context/UserDetailContext';

const Provider = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken, signOut } = useAuth();
  const [userDetail, setUserDetail] = useState();
  const [hasHandledRedirect, setHasHandledRedirect] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("🔄 Provider: isLoaded =", isLoaded, "isSignedIn =", isSignedIn, "pathname =", pathname);
    
    if (!isLoaded) return;
    
    // Don't redirect if user is on dedicated auth pages - let them complete signup/signin first
    // Note: Landing page (/) uses modals, so we allow redirects there after signup completes
    const isDedicatedAuthPage = pathname?.includes('/sign-in') || pathname?.includes('/sign-up');
    if (isDedicatedAuthPage) {
      console.log("⏸️ User on dedicated auth page, skipping redirect");
      return;
    }
    
    if (isSignedIn && user && !hasHandledRedirect) {
      console.log("✅ User authenticated:", user.id);
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
        console.log("🎯 Pending role from localStorage:", pendingRole);
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

      console.log("📤 Sending user data to API:", userData);
      // STEP 2: Sync to database
      const apiResponse = await syncUserToDatabase(userData);
      console.log("📥 API response:", apiResponse);

      // Check if API call failed (returned null)
      if (!apiResponse) {
        console.error("❌ Account creation failed, user will be signed out");
        return; // Exit early, user will be signed out by syncUserToDatabase
      }

      // STEP 3: Use the role from API response (which has the correct role from database)
      const finalRole = apiResponse?.role || pendingRole || 'student';
      console.log("🎯 FINAL ROLE FOR REDIRECT:", finalRole);

      setUserDetail(apiResponse);

      // Clean up
      try {
        localStorage.removeItem('pendingRole');
        console.log("🗑️ Cleaned up pendingRole");
      } catch (e) {}

      // REDIRECT
      console.log("🔄 Redirecting with role:", finalRole);
      
      if (finalRole === 'teacher') {
        console.log("🎯 Redirecting TEACHER to /teacher");
        router.replace('/teacher');
      } else {
        console.log("🎓 Redirecting STUDENT to /workspace");
        router.replace('/workspace');
      }
      
    } catch (error) {
      console.error("❌ Error in redirect:", error);
      router.replace('/workspace');
    }
  };

  const syncUserToDatabase = async (userData) => {
    try {
      console.log("🔄 Syncing user to database...");
      
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ User synced to database:", result);
        return result; // RETURN THE API RESPONSE
      } else {
        // Handle error response
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || 'Failed to create account';
        console.error("❌ API call failed:", errorMessage);
        
        // Display error message to user
        alert(errorMessage);
        
        // Sign out the user since they can't proceed with this account
        // This will redirect them back to the sign-in page
        if (signOut) {
          signOut().catch(console.error);
        }
        
        // Return null to indicate failure
        return null;
      }
    } catch (error) {
      console.error("❌ Failed to sync user:", error);
      alert("An error occurred while creating your account. Please try again.");
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

