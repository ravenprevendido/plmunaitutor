// app/api/user/route.js - FRESH COPY
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { usersTable, teachersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req) {
  let requestedRole = 'account'; // Default for error messages
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, name, role } = await req.json();
    const safeName = name?.trim() || user.firstName || user.username || email?.split("@")[0] || "User";
    requestedRole = role || 'student';
    
    // STEP 1: Check if user already exists in usersTable
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .then(rows => rows[0]);

    // STEP 2: Check if email exists in teachersTable
    const existingTeacher = await db
      .select()
      .from(teachersTable)
      .where(eq(teachersTable.email, email))
      .then(rows => rows[0]);

    // SECURITY: Validate email uniqueness across both tables
    
    // Case 1: User exists in usersTable (SIGN IN scenario)
    if (existingUser) {
      // If they're signing in with the same role, allow it
      if (existingUser.role === requestedRole || !requestedRole || !role) {
        return NextResponse.json(existingUser, { status: 200 });
      }
      // If they're trying to sign in with a different role, prevent it
      return NextResponse.json({ 
        error: `The email you used to create the ${requestedRole} account has already been used.`
      }, { status: 409 });
    }

    // Case 2: Email exists in teachersTable but not in usersTable
    // This prevents creating any account (student or teacher) with an email that's already used as a teacher
    if (existingTeacher) {
      return NextResponse.json({ 
        error: `The email you used to create the ${requestedRole} account has already been used.`
      }, { status: 409 });
    }

    // STEP 3: Create new user (SIGN UP)
    const newUser = await db
      .insert(usersTable)
      .values({
        name: safeName,
        email: email,
        clerk_id: user.id,
        role: requestedRole,
      })
      .returning();
    return NextResponse.json(newUser[0], { status: 201 });
    
  } catch (error) {
    console.error("❌ API ERROR:", error);
    
    // Handle database constraint violations (unique email)
    if (error.message && (error.message.includes('unique') || error.message.includes('duplicate'))) {
      return NextResponse.json({ 
        error: `The email you used to create the ${requestedRole} account has already been used.`
      }, { status: 409 });
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "User API endpoint is working!",
    endpoint: "/api/user",
    method: "GET/POST"
  });
}