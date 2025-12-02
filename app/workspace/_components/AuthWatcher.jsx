// UPDATED AuthWatcher.jsx - WITH BETTER TOAST CONTROL AND CORRECT ROLE DETECTION
'use client';

import { useUser } from '@clerk/nextjs';
import { useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { UserDetailContext } from '@/context/UserDetailContext';

const normalizeRole = (role) => {
  if (!role) return null;
  return role.toLowerCase() === 'teacher' ? 'teacher' : 'student';
};

export default function AuthWatcher() {
  const { user, isLoaded } = useUser();
  const { userDetail } = useContext(UserDetailContext) || {};
  const hasShownToast = useRef(false);
  const lastUserId = useRef(null);
  const fetchedRoleOnce = useRef(false);
  const [userRole, setUserRole] = useState(null);

  // Resolve role from context, localStorage, or API
  useEffect(() => {
    if (!isLoaded || !user) return;

    const resolveRole = async () => {
      // Reset state when user changes
      if (lastUserId.current !== user.id) {
        lastUserId.current = user.id;
        hasShownToast.current = false;
        fetchedRoleOnce.current = false;
        setUserRole(null);
      }

      // 1. Prefer context role (already synced in provider)
      if (userDetail?.role) {
        setUserRole(normalizeRole(userDetail.role));
        return;
      }

      // 2. Use pending role from localStorage (sign-up flow)
      try {
        const pendingRole = localStorage.getItem('pendingRole');
        if (pendingRole) {
          setUserRole(normalizeRole(pendingRole));
          return;
        }
      } catch (error) {
        // Unable to read pendingRole from localStorage
      }

      // 3. Fetch from API only once per session if needed
      if (fetchedRoleOnce.current) return;
      fetchedRoleOnce.current = true;

      try {
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName || user.firstName || '',
            clerk_id: user.id,
            role: null, // Let API return stored role
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.role) {
            setUserRole(normalizeRole(data.role));
            return;
          }
        }
      } catch (error) {
        // Failed to fetch user role for toast
      }

      // 4. Default fallback
      setUserRole((prev) => prev || 'student');
    };

    resolveRole();
  }, [isLoaded, user, userDetail]);

  useEffect(() => {
    // Don't show welcome message if user is not loaded, doesn't exist, or we've already shown it
    if (!isLoaded || !user || hasShownToast.current) {
      if (!isLoaded || !user) {
        hasShownToast.current = false;
        lastUserId.current = null;
        fetchedRoleOnce.current = false;
        setUserRole(null);
      }
      return;
    }

    // Wait for userRole to be resolved
    if (!userRole) {
      return;
    }

    // Check if this is a sign-up (has pendingRole) vs sign-in
    const hasPendingRole = (() => {
      try {
        return !!localStorage.getItem('pendingRole');
      } catch {
        return false;
      }
    })();

    // For sign-up: MUST wait for userDetail (validation check)
    // For sign-in: Can show toast even if userDetail is loading (it's a returning user)
    if (hasPendingRole && !userDetail) {
      return;
    }

    // If userDetail exists but has no role, skip (validation failed)
    if (userDetail && !userDetail.role) {
      return;
    }

    // For sign-in: Show toast immediately if we have role (don't wait for userDetail)
    // For sign-up: Must wait for userDetail (validation check)
    if (!hasPendingRole) {
      // Sign-in case - show toast immediately with available data
      const roleDisplay = userRole === 'teacher' ? 'Teacher' : 'Student';
      let userName = userDetail?.name || user?.firstName || user?.fullName || user?.username;
      if (!userName && user?.primaryEmailAddress?.emailAddress) {
        userName = extractFirstNameFromEmail(user.primaryEmailAddress.emailAddress);
      }
      
      const welcomeMessage = userName
        ? `Welcome back, ${roleDisplay} ${userName}!`
        : `Welcome back, ${roleDisplay}!`;

      toast.success(welcomeMessage, {
        icon: roleDisplay === 'Teacher' ? '👨‍🏫' : '🎓',
        duration: 4000,
        id: 'auth-welcome-toast',
      });

      hasShownToast.current = true;
      return;
    }

    // Sign-up case - userDetail should be available now
    const roleDisplay = userRole === 'teacher' ? 'Teacher' : 'Student';
    let userName = userDetail?.name || user?.firstName || user?.fullName || user?.username;
    if (!userName && user?.primaryEmailAddress?.emailAddress) {
      userName = extractFirstNameFromEmail(user.primaryEmailAddress.emailAddress);
    }

    // Determine if this is a new signup
    const isNewUser = userDetail?.isNewUser === true;
    
    // Create appropriate welcome message
    let welcomeMessage;
    if (isNewUser) {
      // New user signup message
      welcomeMessage = userName
        ? `Welcome, ${roleDisplay} ${userName}!`
        : `Welcome, ${roleDisplay}!`;
    } else {
      // Returning user sign-in message (shouldn't happen for sign-up, but handle it)
      welcomeMessage = userName
        ? `Welcome back, ${roleDisplay} ${userName}!`
        : `Welcome back, ${roleDisplay}!`;
    }

    toast.success(welcomeMessage, {
      icon: roleDisplay === 'Teacher' ? '👨‍🏫' : '🎓',
      duration: 4000,
      id: 'auth-welcome-toast',
    });

    hasShownToast.current = true;

    try {
      localStorage.removeItem('pendingRole');
    } catch (error) {
      // Unable to clear pendingRole from localStorage
    }
  }, [isLoaded, user, userRole, userDetail]);

  return null;
}

function extractFirstNameFromEmail(email) {
  const emailUsername = email.split('@')[0];
  let firstName = emailUsername
    .replace(/[0-9._-]/g, ' ')
    .split(' ')[0]
    .trim();
  
  if (firstName) {
    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  }
  
  return firstName;
}