// hooks/useAdminShortcut.js
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

// Generate a secure token for admin access
function generateAdminToken() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const token = btoa(`${timestamp}-${random}-admin-secret`).replace(/[^a-zA-Z0-9]/g, '');
  return token;
}

export function useAdminShortcut() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyPress = async (event) => {
      // Ctrl + P shortcut for secure admin access
      if (event.ctrlKey && (event.key === 'p' || event.key === 'P')) {
        event.preventDefault();
        event.stopPropagation();
        
        try {
          let shouldAllowAccess = false;
          let currentIP = null;
          
          // Check if IP is whitelisted before allowing access
          try {
            const ipCheckResponse = await fetch('/api/admin/ip-whitelist');
            
            if (ipCheckResponse.ok) {
              const ipData = await ipCheckResponse.json();
              currentIP = ipData.currentIP;
              
              // If whitelist is empty (first-time setup), automatically add current IP and allow access
              const isEmptyWhitelist = !ipData.whitelistedIPs || ipData.whitelistedIPs.length === 0;
              
              if (isEmptyWhitelist && currentIP) {
                // First-time setup - automatically whitelist current IP
                try {
                  const addIPResponse = await fetch('/api/admin/ip-whitelist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ip_address: currentIP,
                      description: 'Main Admin Device (Auto-added on first access)',
                      added_by: 'system',
                    }),
                  });
                  
                  if (addIPResponse.ok) {
                    toast.success(`Your device (${currentIP}) has been automatically whitelisted!`, {
                      duration: 4000,
                      position: 'top-right',
                      style: {
                        background: '#1f2937',
                        color: '#fff',
                        border: '2px solid #22c55e',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        boxShadow: '0 10px 25px rgba(34, 197, 94, 0.4)',
                        maxWidth: '400px',
                      },
                      icon: '✅',
                    });
                  } else {
                    // If auto-add fails, still allow first-time access
                    toast.success('First-time admin access granted. Your IP will be auto-added.', {
                      duration: 4000,
                      position: 'top-right',
                      style: {
                        background: '#1f2937',
                        color: '#fff',
                        border: '2px solid #22c55e',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        boxShadow: '0 10px 25px rgba(34, 197, 94, 0.4)',
                        maxWidth: '400px',
                      },
                      icon: '✅',
                    });
                  }
                } catch (addError) {
                  // Even if adding fails, allow first-time access
                  console.error('Failed to auto-add IP:', addError);
                  toast.success('First-time admin access granted.', {
                    duration: 3000,
                    position: 'top-right',
                    style: {
                      background: '#1f2937',
                      color: '#fff',
                      border: '2px solid #22c55e',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      boxShadow: '0 10px 25px rgba(34, 197, 94, 0.4)',
                      maxWidth: '400px',
                    },
                    icon: '✅',
                  });
                }
                shouldAllowAccess = true; // Allow first-time access
              } else if (ipData.isWhitelisted) {
                // IP is whitelisted - allow access
                shouldAllowAccess = true;
              } else {
                // IP not whitelisted and whitelist is not empty - block access
                toast.error(`Your IP (${currentIP || 'unknown'}) is not whitelisted. Please contact admin to whitelist your device.`, {
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
                  icon: '🚫',
                });
                return; // Block access
              }
            } else {
              // API failed (table might not exist) - allow first-time access
              console.warn('IP whitelist check failed, allowing first-time access');
              toast.success('First-time admin access granted. Setting up IP whitelist...', {
                duration: 4000,
                position: 'top-right',
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  border: '2px solid #22c55e',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 10px 25px rgba(34, 197, 94, 0.4)',
                  maxWidth: '400px',
                },
                icon: '✅',
              });
              shouldAllowAccess = true; // Allow first-time access when API fails
            }
          } catch (fetchError) {
            // Network error or other fetch issues - allow first-time access
            console.warn('IP whitelist check error, allowing first-time access:', fetchError);
            toast.success('First-time admin access granted.', {
              duration: 3000,
              position: 'top-right',
              style: {
                background: '#1f2937',
                color: '#fff',
                border: '2px solid #22c55e',
                borderRadius: '12px',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 10px 25px rgba(34, 197, 94, 0.4)',
                maxWidth: '400px',
              },
              icon: '✅',
            });
            shouldAllowAccess = true; // Allow first-time access on error
          }
          
          // If access is not allowed, return early
          if (!shouldAllowAccess) {
            return;
          }
          
          // IP is whitelisted - proceed with token generation
          const adminToken = generateAdminToken();
          const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes validity
          
          // Store token in sessionStorage FIRST (cleared when tab closes)
          try {
            sessionStorage.setItem('adminAccessToken', adminToken);
            sessionStorage.setItem('adminTokenExpiry', expiresAt.toString());
          } catch (e) {
            // If sessionStorage fails, still allow but log error
            console.error('Failed to store admin token:', e);
          }
          
          // Small delay to ensure sessionStorage is set before navigation
          setTimeout(() => {
            // Navigate to admin with token
            router.push(`/admin?token=${adminToken}`);
          }, 50);
        } catch (error) {
          // If IP check fails, block access for security
          toast.error('Unable to verify device authorization. Access denied.', {
            duration: 4000,
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
            icon: '🚫',
          });
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [router]);
}

