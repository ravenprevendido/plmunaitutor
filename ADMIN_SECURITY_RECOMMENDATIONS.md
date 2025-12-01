# Admin Security Recommendations

## 🔴 CRITICAL Security Issues to Fix

### 1. **Fix Password Authentication (IMMEDIATE)**

**Current Issue**: Admin passwords are hardcoded and compared in plain text.

**Location**: `app/api/admin/login/route.js:35-37`

**Fix Required**:
```javascript
import bcrypt from 'bcryptjs';

// Replace the hardcoded check with:
const isValidPassword = await bcrypt.compare(password, adminUser.passwordHash);

if (!isValidPassword) {
  return NextResponse.json(
    { error: 'Invalid credentials' },
    { status: 401 }
  );
}
```

**Action Items**:
- [ ] Update login route to use bcrypt
- [ ] Hash existing admin passwords in database
- [ ] Create a script to hash passwords for existing admins

---

### 2. **Replace localStorage with Secure Session Management (IMMEDIATE)**

**Current Issue**: Admin session stored in localStorage (vulnerable to XSS attacks).

**Location**: `app/admin/components/LoginAdmin.jsx:33-34` and `app/admin/dashboard/page.jsx:54-55`

**Recommended Solution**: Use HTTP-only cookies with JWT tokens

**Implementation Steps**:

#### Step 1: Create JWT-based session system
Create `lib/admin-auth.js`:
```javascript
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-secret-key-change-this';
const SESSION_DURATION = 60 * 60 * 24; // 24 hours

export async function createAdminSession(adminUser) {
  const token = jwt.sign(
    { 
      id: adminUser.id, 
      email: adminUser.email,
      role: 'admin',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: SESSION_DURATION }
  );

  const cookieStore = await cookies();
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION,
    path: '/'
  });

  return token;
}

export async function verifyAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}
```

#### Step 2: Update login API route
Update `app/api/admin/login/route.js`:
```javascript
import { createAdminSession } from '@/lib/admin-auth';

// After successful password verification:
const session = await createAdminSession(adminUser);

return NextResponse.json({
  success: true,
  message: 'Login successful',
  user: {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: adminUser.role
  }
});
```

#### Step 3: Create middleware for admin routes
Create `middleware/admin-auth.js`:
```javascript
import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';

export async function requireAdminAuth(request) {
  const session = await verifyAdminSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return session;
}
```

#### Step 4: Update admin dashboard to check server-side
Create `app/api/admin/verify/route.js`:
```javascript
import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';

export async function GET(request) {
  const session = await verifyAdminSession();
  
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ 
    authenticated: true,
    user: {
      id: session.id,
      email: session.email
    }
  });
}
```

#### Step 5: Update client-side components
Update `app/admin/dashboard/page.jsx`:
```javascript
// Replace localStorage check with API call
useEffect(() => {
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/verify');
      const data = await response.json();
      
      if (!data.authenticated) {
        router.push('/admin');
        return;
      }
      
      setAdminUser(data.user);
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin');
    }
  };

  checkAuth();
}, [router]);
```

**Action Items**:
- [ ] Install `jsonwebtoken` package: `npm install jsonwebtoken`
- [ ] Create `lib/admin-auth.js`
- [ ] Update login route
- [ ] Create admin verification API
- [ ] Update all admin components to use API instead of localStorage
- [ ] Remove all localStorage admin code

---

### 3. **Add Server-Side Authorization Checks (IMMEDIATE)**

**Current Issue**: Admin API routes are public in middleware and have no authorization checks.

**Location**: `middleware.js:7-8` and all admin API routes

**Fix Required**:

#### Step 1: Remove admin routes from public routes
Update `middleware.js`:
```javascript
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  // Remove '/admin(.*)' and '/api/admin(.*)' from here
  '/api/courses(.*)',
  '/api/stats(.*)',
])
```

#### Step 2: Create admin route protection
Create `app/api/admin/middleware.js`:
```javascript
import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';

export async function requireAdmin(request) {
  const session = await verifyAdminSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  return session;
}
```

#### Step 3: Protect all admin API routes
Example for `app/api/admin-teacher-requests/route.js`:
```javascript
import { requireAdmin } from '../middleware';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin; // Error response
  
  // Rest of your code...
}
```

**Action Items**:
- [ ] Remove admin routes from public middleware
- [ ] Create admin middleware helper
- [ ] Add authorization checks to all admin API routes:
  - [ ] `/api/admin-teacher-requests`
  - [ ] `/api/admin-teachers`
  - [ ] `/api/admin/total-students`
  - [ ] `/api/admin/weekly-usage`
  - [ ] All other admin API routes

---

### 4. **Add Rate Limiting (HIGH PRIORITY)**

**Current Issue**: Admin login can be brute-forced.

**Fix Required**: Install and configure rate limiting

```bash
npm install @upstash/ratelimit @upstash/redis
```

Create `lib/rate-limit.js`:
```javascript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Admin login: 5 attempts per 15 minutes
export const adminLoginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
});

// Admin API: 100 requests per minute
export const adminApiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
});
```

Update `app/api/admin/login/route.js`:
```javascript
import { adminLoginLimiter } from '@/lib/rate-limit';

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await adminLoginLimiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }

  // Rest of login logic...
}
```

**Action Items**:
- [ ] Set up Upstash Redis (or use alternative)
- [ ] Create rate limiting utilities
- [ ] Add rate limiting to admin login
- [ ] Add rate limiting to admin API routes

---

### 5. **Add Input Validation (HIGH PRIORITY)**

**Current Issue**: No validation on admin login inputs.

**Fix Required**: Add Zod validation

```bash
npm install zod
```

Update `app/api/admin/login/route.js`:
```javascript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;
    // Rest of login logic...
  }
}
```

**Action Items**:
- [ ] Install Zod
- [ ] Add validation schemas for all admin inputs
- [ ] Validate login form
- [ ] Validate all admin API inputs

---

### 6. **Add CSRF Protection (MEDIUM PRIORITY)**

**Fix Required**: Add CSRF tokens for state-changing operations

Create `lib/csrf.js`:
```javascript
import { randomBytes } from 'crypto';

export function generateCSRFToken() {
  return randomBytes(32).toString('hex');
}

export function validateCSRFToken(token, sessionToken) {
  return token === sessionToken;
}
```

**Action Items**:
- [ ] Implement CSRF token generation
- [ ] Add CSRF validation to POST/PUT/DELETE admin routes
- [ ] Include CSRF tokens in admin forms

---

### 7. **Add Security Headers (MEDIUM PRIORITY)**

Update `next.config.mjs`:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

### 8. **Add Audit Logging (MEDIUM PRIORITY)**

Create `lib/admin-audit.js`:
```javascript
import { db } from '@/config/db';
import { adminAuditLogTable } from '@/config/schema';

export async function logAdminAction(adminId, action, details) {
  await db.insert(adminAuditLogTable).values({
    admin_id: adminId,
    action,
    details: JSON.stringify(details),
    ip_address: details.ip,
    user_agent: details.userAgent,
    created_at: new Date(),
  });
}
```

Add to schema:
```javascript
export const adminAuditLogTable = pgTable('admin_audit_logs', {
  id: serial('id').primaryKey(),
  admin_id: integer('admin_id').references(() => adminUsersTable.id),
  action: varchar('action', { length: 255 }).notNull(),
  details: jsonb('details'),
  ip_address: varchar('ip_address', { length: 45 }),
  user_agent: text('user_agent'),
  created_at: timestamp('created_at').defaultNow(),
});
```

**Action Items**:
- [ ] Create audit log table
- [ ] Log all admin actions (login, logout, data changes)
- [ ] Create admin audit log viewer

---

### 9. **Add Session Timeout (MEDIUM PRIORITY)**

Update `app/admin/dashboard/page.jsx`:
```javascript
useEffect(() => {
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  let timeoutId;

  const resetTimeout = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      handleLogout();
      toast.error('Session expired. Please login again.');
    }, SESSION_TIMEOUT);
  };

  // Reset on user activity
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, resetTimeout);
  });

  resetTimeout();


  return () => {
    clearTimeout(timeoutId);
    events.forEach(event => {
      document.removeEventListener(event, resetTimeout);
    });
  };
}, []);
```

---

### 10. **Add Two-Factor Authentication (OPTIONAL - LONG TERM)**

Consider adding 2FA for admin accounts using:
- TOTP (Time-based One-Time Password)
- SMS verification
- Email verification

---



## 📋 Implementation Priority


### Phase 1 (IMMEDIATE - This Week):
1. ✅ Fix password hashing
2. ✅ Replace localStorage with secure sessions
3. ✅ Add server-side authorization checks
4. ✅ Add input validation

### Phase 2 (HIGH PRIORITY - Next Week):
5. ✅ Add rate limiting
6. ✅ Add security headers
7. ✅ Add session timeout

### Phase 3 (MEDIUM PRIORITY - Next 2 Weeks):
8. ✅ Add CSRF protection
9. ✅ Add audit logging
10. ✅ Security testing

---

## 🔒 Security Checklist

Before going to production, ensure:

- [ ] All admin passwords are hashed with bcrypt
- [ ] Admin sessions use HTTP-only cookies
- [ ] All admin API routes require authentication
- [ ] Rate limiting is implemented
- [ ] Input validation is in place
- [ ] Security headers are configured
- [ ] Session timeout is implemented
- [ ] CSRF protection is active
- [ ] Audit logging is enabled
- [ ] Admin routes removed from public middleware
- [ ] No sensitive data in localStorage
- [ ] Environment variables are secure
- [ ] Error messages don't leak sensitive info

---

## 🧪 Testing Security

After implementing fixes:

1. **Test password hashing**: Verify old plain text passwords no longer work
2. **Test session security**: Try accessing admin routes without valid session
3. **Test rate limiting**: Attempt multiple login failures
4. **Test authorization**: Try accessing admin APIs without proper auth
5. **Test XSS protection**: Verify localStorage is not used
6. **Test CSRF**: Attempt cross-site requests

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

