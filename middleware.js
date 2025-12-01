import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/admin(.*)',           // Add this line
  '/api/admin(.*)',        // Add this line
  '/api/courses(.*)',           // 👈 ADD THIS
  '/api/courses/teacher(.*)',   // 👈 ADD THIS
  '/api/stats(.*)',
  // '/workspace/my-courses/(.*)/quiz/(.*)', // 👈 ADD THIS LINE
  // '/workspace/my-courses/(.*)'  
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}