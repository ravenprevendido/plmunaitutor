import { db } from '@/config/db';
import { courseRequestsTable, coursesTable, teachersTable } from '@/config/schema';
import { eq, and, ne } from 'drizzle-orm'; // Added 'ne' import
import { NextResponse } from 'next/server';

// GET all teacher requests
export async function GET() {
  try {
    console.log("📋 Fetching all teacher requests...");
    
    const requests = await db
      .select()
      .from(courseRequestsTable)
      .orderBy(courseRequestsTable.created_at);
    
    console.log(`✅ Found ${requests.length} teacher requests`);
    return NextResponse.json(requests);
  } catch (error) {
    console.error('❌ Error fetching teacher requests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - create new teacher request
export async function POST(request) {
  try {
    const { course_id, teacher_name, teacher_email, course_title, course_category } = await request.json();
    
    console.log("📝 Creating teacher request:", {
      course_id, teacher_name, teacher_email, course_title, course_category
    });

    // ✅ VALIDATION 1: Check if course exists
    const existingCourse = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, course_id))
      .then(rows => rows[0]);

    if (!existingCourse) {
      return NextResponse.json({ 
        error: 'Course not found' 
      }, { status: 404 });
    }

    // ✅ VALIDATION 2: Check if course is already assigned to a teacher
    if (existingCourse.assigned_teacher_id) {
      return NextResponse.json({ 
        error: 'This course is already assigned to another teacher and cannot be requested.' 
      }, { status: 400 });
    }

    // ✅ VALIDATION 3: Check if request already exists from this teacher for this course
    const existingRequestFromSameTeacher = await db
      .select()
      .from(courseRequestsTable)
      .where(eq(courseRequestsTable.course_id, course_id))
      .where(eq(courseRequestsTable.teacher_email, teacher_email))
      .where(eq(courseRequestsTable.status, 'pending'));

    if (existingRequestFromSameTeacher.length > 0) {
      return NextResponse.json({ 
        error: 'You already have a pending request for this course' 
      }, { status: 400 });
    }

    // ✅ VALIDATION 4: Check if there are any pending requests for this course from other teachers
    const existingPendingRequestsForCourse = await db
      .select()
      .from(courseRequestsTable)
      .where(eq(courseRequestsTable.course_id, course_id))
      .where(eq(courseRequestsTable.status, 'pending'));

    if (existingPendingRequestsForCourse.length > 0) {
      return NextResponse.json({ 
        error: 'There is already a pending request for this course from another teacher. Please try another course.' 
      }, { status: 400 });
    }

    // ✅ VALIDATION 5: Check if teacher is already assigned to this course
    if (existingCourse.assigned_teacher_id === teacher_email) {
      return NextResponse.json({ 
        error: 'You are already assigned to this course' 
      }, { status: 400 });
    }

    // Create the new request
    const newRequest = await db
      .insert(courseRequestsTable)
      .values({
        course_id,
        teacher_name,
        teacher_email,
        course_title,
        course_category,
        status: 'pending'
      })
      .returning();

    console.log("✅ Teacher request created:", newRequest[0]);

    return NextResponse.json(newRequest[0], { status: 201 });

  } catch (error) {
    console.error('❌ Error creating teacher request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - approve/reject teacher request
export async function PUT(request) {
  try {
    const { requestId, action } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: requestId and action' 
      }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "approved" or "rejected"' 
      }, { status: 400 });
    }

    console.log(`🔄 Processing teacher request ${requestId} with action: ${action}`);

    // Get the request first
    const requestData = await db
      .select()
      .from(courseRequestsTable)
      .where(eq(courseRequestsTable.id, requestId))
      .then(rows => rows[0]);

    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Check if request is already processed
    if (requestData.status !== 'pending') {
      return NextResponse.json({ 
        error: `This request has already been ${requestData.status}` 
      }, { status: 400 });
    }

    if (action === 'approved') {
      // ✅ VALIDATION: Check if course is already assigned to another teacher
      const existingCourse = await db
        .select()
        .from(coursesTable)
        .where(eq(coursesTable.id, requestData.course_id))
        .then(rows => rows[0]);

      if (!existingCourse) {
        return NextResponse.json({ 
          error: 'Course not found' 
        }, { status: 404 });
      }

      if (existingCourse.assigned_teacher_id) {
        return NextResponse.json({ 
          error: 'This course is already assigned to another teacher. Please reject this request.' 
        }, { status: 400 });
      }

      // ✅ VALIDATION: Check if teacher already has too many courses (optional limit)
      const teacherCoursesCount = await db
        .select()
        .from(coursesTable)
        .where(eq(coursesTable.assigned_teacher_id, requestData.teacher_email))
        .then(rows => rows.length);

      // Optional: Set a limit for courses per teacher
      const MAX_COURSES_PER_TEACHER = 5; // You can adjust this number
      if (teacherCoursesCount >= MAX_COURSES_PER_TEACHER) {
        return NextResponse.json({ 
          error: `This teacher already has ${teacherCoursesCount} courses. Maximum allowed is ${MAX_COURSES_PER_TEACHER}.` 
        }, { status: 400 });
      }

      // Start transaction-like operations
      try {
        // 1. Update request status to approved
        await db
          .update(courseRequestsTable)
          .set({ status: 'approved' })
          .where(eq(courseRequestsTable.id, requestId));

        // 2. Update course with assigned teacher
        await db
          .update(coursesTable)
          .set({ assigned_teacher_id: requestData.teacher_email })
          .where(eq(coursesTable.id, requestData.course_id));

        // 3. Check if teacher exists, if not create one
        const existingTeacher = await db
          .select()
          .from(teachersTable)
          .where(eq(teachersTable.email, requestData.teacher_email))
          .then(rows => rows[0]);

        if (existingTeacher) {
          // Update existing teacher
          await db
            .update(teachersTable)
            .set({ 
              total_courses: (existingTeacher.total_courses || 0) + 1,
              course_title: requestData.course_title,
              status: 'active'
            })
            .where(eq(teachersTable.email, requestData.teacher_email));
          
          console.log(`✅ Updated existing teacher: ${requestData.teacher_name}`);
        } else {
          // Create new teacher
          await db.insert(teachersTable).values({
            name: requestData.teacher_name,
            email: requestData.teacher_email,
            course_title: requestData.course_title,
            total_courses: 1,
            status: 'active'
          });
          
          console.log(`✅ Created new teacher: ${requestData.teacher_name}`);
        }

        // 4. Reject all other pending requests for this same course (FIXED)
        await db
          .update(courseRequestsTable)
          .set({ status: 'rejected' })
          .where(
            and(
              eq(courseRequestsTable.course_id, requestData.course_id),
              eq(courseRequestsTable.status, 'pending'),
              ne(courseRequestsTable.id, requestId) // Use 'ne' instead of '!='
            )
          );

        console.log(`✅ Course "${requestData.course_title}" assigned to ${requestData.teacher_name}`);
        console.log(`✅ Rejected all other pending requests for this course`);

      } catch (dbError) {
        console.error('❌ Database error during approval:', dbError);
        // Attempt to rollback by setting request back to pending
        await db
          .update(courseRequestsTable)
          .set({ status: 'pending' })
          .where(eq(courseRequestsTable.id, requestId));
        
        throw new Error('Failed to complete approval process');
      }

    } else if (action === 'rejected') {
      // Update request status to rejected
      await db
        .update(courseRequestsTable)
        .set({ status: 'rejected' })
        .where(eq(courseRequestsTable.id, requestId));
      
      console.log(`❌ Teacher request rejected for ${requestData.teacher_name}`);
    }

    return NextResponse.json({ 
      message: `Request ${action} successfully`,
      teacher_name: requestData.teacher_name,
      course_title: requestData.course_title,
      action: action
    });

  } catch (error) {
    console.error('❌ Error updating teacher request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - remove a teacher request (admin only)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json({ 
        error: 'Missing request ID' 
      }, { status: 400 });
    }

    console.log(`🗑️ Deleting teacher request ${requestId}`);

    // Check if request exists
    const requestData = await db
      .select()
      .from(courseRequestsTable)
      .where(eq(courseRequestsTable.id, requestId))
      .then(rows => rows[0]);

    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Delete the request
    await db
      .delete(courseRequestsTable)
      .where(eq(courseRequestsTable.id, requestId));

    console.log(`✅ Teacher request deleted: ${requestData.teacher_name} for ${requestData.course_title}`);
    
    return NextResponse.json({ 
      message: 'Teacher request deleted successfully',
      teacher_name: requestData.teacher_name,
      course_title: requestData.course_title
    });

  } catch (error) {
    console.error('❌ Error deleting teacher request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}