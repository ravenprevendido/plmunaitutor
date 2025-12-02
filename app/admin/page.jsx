'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminLoginForm from './components/LoginAdmin';

const AdminPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = () => {
      try {
        // Get token from URL
        const urlToken = searchParams.get('token');
        
        // Get token from sessionStorage immediately
        const storedToken = sessionStorage.getItem('adminAccessToken');
        const tokenExpiry = sessionStorage.getItem('adminTokenExpiry');
        
        // If URL token exists, store it immediately (even if sessionStorage check happens later)
        if (urlToken) {
          const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
          try {
            sessionStorage.setItem('adminAccessToken', urlToken);
            sessionStorage.setItem('adminTokenExpiry', expiresAt.toString());
          } catch (e) {
            console.error('Failed to store token:', e);
          }
        }
        
        // Small delay to ensure everything is ready
        setTimeout(() => {
          try {
            // Re-check after delay
            const finalStoredToken = sessionStorage.getItem('adminAccessToken');
            const finalTokenExpiry = sessionStorage.getItem('adminTokenExpiry');
            
            // Check if token exists and is valid
            // Allow if URL token exists OR if stored token exists
            const hasUrlToken = !!urlToken;
            const hasStoredToken = !!finalStoredToken;
            const tokensMatch = urlToken && finalStoredToken && urlToken === finalStoredToken;
            const hasValidToken = hasUrlToken || hasStoredToken;
            const isTokenExpired = finalTokenExpiry && Date.now() > parseInt(finalTokenExpiry);
            
            if (hasValidToken && !isTokenExpired) {
              // Token is valid - allow access
              setIsAuthorized(true);
              setIsChecking(false);
              
              // Clean up URL token after validation (for security)
              if (urlToken) {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
              }
            } else {
              // No valid token - show blank page (don't redirect)
              sessionStorage.removeItem('adminAccessToken');
              sessionStorage.removeItem('adminTokenExpiry');
              setIsAuthorized(false);
              setIsChecking(false);
            }
          } catch (error) {
            console.error('Token validation error:', error);
            setIsAuthorized(false);
            setIsChecking(false);
          }
        }, 100); // Small delay to ensure sessionStorage is ready
        
      } catch (error) {
        console.error('Admin access check error:', error);
        setIsAuthorized(false);
        setIsChecking(false);
      }
    };

    checkAdminAccess();
  }, [router, searchParams]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Only show login form if authorized
  // If not authorized, show blank page (no indication of admin route)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0d1117]">
        {/* Completely blank - no indication this is an admin route */}
      </div>
    );
  }

  return <AdminLoginForm />;
};

export default AdminPage;
