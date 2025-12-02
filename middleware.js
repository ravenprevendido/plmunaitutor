import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/admin',               // Admin login page - uses custom token-based security
  '/admin/',              // Admin login page (with trailing slash)
  '/admin/dashboard(.*)', // Admin dashboard - uses custom localStorage auth
  '/api/admin/login',     // Admin login API is public (handles its own auth)
  '/api/admin/ip-whitelist', // IP whitelist API (needs to be accessible for IP check)
  '/api/courses(.*)',           
  '/api/courses/teacher(.*)',   
  '/api/stats(.*)',
  // '/workspace/my-courses/(.*)/quiz/(.*)', 
  // '/workspace/my-courses/(.*)'  
])

export default clerkMiddleware(async (auth, req) => {
  // Check if this is an admin route - if so, skip Clerk protection
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Admin routes use custom authentication - don't protect with Clerk
    // Return early to skip Clerk middleware
    return;
  }
  
  // For all other routes, use Clerk protection if not public
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
  
  // Return undefined to continue with normal Next.js flow
  return;
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}