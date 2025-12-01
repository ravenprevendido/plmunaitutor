import { db } from '@/config/db';
import { assignmentsTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(request, { params }) {
  try {
    const { id, assignmentId } = await params;
    
    // Get assignment to check for attachment
    const assignment = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, assignmentId))
      .then(rows => rows[0]);

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Delete attachment file if exists
    if (assignment.attachment_url) {
      try {
        const filepath = join(process.cwd(), 'public', assignment.attachment_url);
        await unlink(filepath);
      } catch (error) {
        console.error('Error deleting attachment file:', error);
        // Continue even if file deletion fails
      }
    }

    // Delete assignment from database
    await db
      .delete(assignmentsTable)
      .where(eq(assignmentsTable.id, assignmentId));

    return NextResponse.json({ message: 'Assignment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

