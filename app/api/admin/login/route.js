// app/api/admin/login/route.js
import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { adminUsersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Find admin user
    const adminUsers = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.email, email))
      .limit(1);

    if (adminUsers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const adminUser = adminUsers[0];

    // Check if admin is active
    if (!adminUser.isActive) {
      return NextResponse.json(
        { error: 'Admin account is deactivated' },
        { status: 401 }
      );
    }

    // TEMPORARY: Accept "password" without bcrypt verification
    // This is just for testing until you install bcryptjs
    const isValidPassword = password === 'password';

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 } 
      );
    }

    // Update last login
    await db
      .update(adminUsersTable)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsersTable.id, adminUser.id));

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

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}