// app/api/user/route.js - FRESH COPY
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { usersTable, teachersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    console.log("🎯 API USER POST CALLED");
    
    const user = await currentUser();
    console.log("Clerk user:", user?.id);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, name, role } = await req.json();
    console.log("Request body:", { email, name, role });
    const safeName = name?.trim() || user.firstName || user.username || email?.split("@")[0] || "User";
    const requestedRole = role || 'student';
    
    // STEP 1: Check if user already exists in usersTable (SIGN IN scenario)
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .then(rows => rows[0]);

    // If user exists, return them immediately (SIGN IN - no role validation needed)
    if (existingUser) {
      console.log("✅ User exists (SIGN IN):", existingUser);
      return NextResponse.json(existingUser, { status: 200 });
    }

    // STEP 2: User doesn't exist - this is SIGN UP scenario
    // Now validate role conflicts before creating new account
    
    // Check if email exists in teachersTable
    const existingTeacher = await db
      .select()
      .from(teachersTable)
      .where(eq(teachersTable.email, email))
      .then(rows => rows[0]);

    // SECURITY: If email exists as teacher, cannot create student account
    if (existingTeacher && requestedRole === 'student') {
      console.log(`❌ SECURITY: Email ${email} already exists as teacher, cannot create as student`);
      return NextResponse.json({ 
        error: `This email is already registered as a teacher. Each email can only be used for one account type. Please use a different email or sign in with your existing teacher account.`
      }, { status: 409 });
    }

    // STEP 3: Create new user (SIGN UP)
    console.log("🆕 Creating new user (SIGN UP)");
    const newUser = await db
      .insert(usersTable)
      .values({
        name: safeName,
        email: email,
        clerk_id: user.id,
        role: requestedRole,
      })
      .returning();
    console.log("✅ New user created:", newUser[0]);
    return NextResponse.json(newUser[0], { status: 201 });
    
  } catch (error) {
    console.error("❌ API ERROR:", error);
    
    // Handle database constraint violations (unique email)
    if (error.message && (error.message.includes('unique') || error.message.includes('duplicate'))) {
      return NextResponse.json({ 
        error: "This email is already registered. Each email can only be used for one account type (student or teacher). Please use a different email or sign in with your existing account."
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