import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { coursesTable, enrollmentsTable, teachersTable } from '@/config/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const countQuery = (expression) => sql`CAST(${expression} AS INTEGER)`;

export async function GET() {
  try {
    const [studentRow] = await db
      .select({
        count: countQuery(
          sql`COUNT(DISTINCT CASE WHEN ${enrollmentsTable.status} = 'approved' THEN ${enrollmentsTable.student_id} END)`
        ),
      })
      .from(enrollmentsTable);

    const [teacherRow] = await db
      .select({
        count: countQuery(sql`COUNT(*)`),
      })
      .from(teachersTable)
      .where(eq(teachersTable.status, 'active'));

    const [courseRow] = await db
      .select({
        count: countQuery(sql`COUNT(*)`),
      })
      .from(coursesTable);

    return NextResponse.json({
      students: studentRow?.count ?? 0,
      teachers: teacherRow?.count ?? 0,
      courses: courseRow?.count ?? 0,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

