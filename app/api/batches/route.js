import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - List all batches (active first, then by createdAt desc)
// Each batch includes its enrolled students via BatchStudent join table
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const where = session.user.role === "student" ? {
      students: {
        some: { userId: session.user.id }
      }
    } : {};

    const batches = await prisma.batch.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },   // active batch always first
        { createdAt: 'desc' },  // then newest first
      ],
      include: {
        students: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { user: { name: 'asc' } },
        },
      },
    });

    // Flatten BatchStudent → plain student objects for the frontend
    const shaped = batches.map((b) => ({
      id: b.id,
      name: b.name,
      driveFolderId: b.driveFolderId,
      isActive: b.isActive,
      createdAt: b.createdAt,
      students: b.students.map((bs) => bs.user),
    }));

    return NextResponse.json({ batches: shaped });
  } catch (error) {
    console.error('Get batches error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new batch and enroll students
// Body: {
//   name: string,
//   driveFolderId: string,
//   setActive: boolean,          // teacher decides whether this is now the live batch
//   existingStudentIds: string[], // IDs of existing User records to enrol
//   newStudents: Array<{ name, email }> // new students to create/upsert
// }
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      driveFolderId,
      setActive = false,
      existingStudentIds = [],
      newStudents = [],
    } = body;

    if (!name || !driveFolderId) {
      return NextResponse.json(
        { error: 'Batch name and Drive folder ID are required' },
        { status: 400 }
      );
    }

    // If this batch should become active, deactivate all others first
    if (setActive) {
      await prisma.batch.updateMany({ data: { isActive: false } });
    }

    // Create the batch
    const batch = await prisma.batch.create({
      data: { name, driveFolderId, isActive: setActive },
    });

    // Collect all user IDs to enroll
    const userIdsToEnroll = [...existingStudentIds];

    // Upsert new students into AuthorizedUser + User
    for (const s of newStudents) {
      if (!s.email?.trim()) continue;
      const email = s.email.trim().toLowerCase();
      const studentName = s.name?.trim() || email;

      // Allow them to sign in
      await prisma.authorizedUser.upsert({
        where: { email },
        update: { name: studentName, role: 'student' },
        create: { email, name: studentName, role: 'student', addedBy: session.user.email },
      });

      // Create User if not yet signed up
      const user = await prisma.user.upsert({
        where: { email },
        update: {}, // don't overwrite anything on existing users
        create: { email, name: studentName, role: 'student' },
      });

      userIdsToEnroll.push(user.id);
    }

    // l all students in the new batch via the join table
    // createMany with skipDuplicates handles the case where the student is
    // already enrolled (e.g. re-enrolling an existing student in a new batch)
    if (userIdsToEnroll.length) {
      await prisma.batchStudent.createMany({
        data: userIdsToEnroll.map((userId) => ({ batchId: batch.id, userId })),
        skipDuplicates: true,
      });
    }

    // Return the fully populated batch
    const created = await prisma.batch.findUnique({
      where: { id: batch.id },
      include: {
        students: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { user: { name: 'asc' } },
        },
      },
    });

    return NextResponse.json({
      batch: {
        ...created,
        students: created.students.map((bs) => bs.user),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create batch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Set a batch as active (deactivates all others)
// Body: { batchId: string }
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { batchId } = await request.json();
    if (!batchId) {
      return NextResponse.json({ error: 'batchId required' }, { status: 400 });
    }

    await prisma.batch.updateMany({ data: { isActive: false } });
    const updated = await prisma.batch.update({
      where: { id: batchId },
      data: { isActive: true },
    });

    return NextResponse.json({ batch: updated });
  } catch (error) {
    console.error('Set active batch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT — add a student to an existing batch
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { batchId, studentId } = await request.json();

    if (!batchId || !studentId) {
      return NextResponse.json({ error: 'batchId and studentId are required' }, { status: 400 });
    }

    // Verify batch exists and is active
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        students:
        {
          include:
          {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        }
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (!batch.isActive) {
      return NextResponse.json({ error: 'Cannot add students to an archived batch' }, { status: 400 });
    }

    // Check student isn't already in the batch
    const alreadyEnrolled = batch.students.some((s) => s.userId === studentId);
    if (alreadyEnrolled) {
      return NextResponse.json({ error: 'Student is already in this batch' }, { status: 409 });
    }

    await prisma.batchStudent.create({
      data: {
        batchId,
        userId: studentId,
      },
    });

    const updated = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        students: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
    });

    return NextResponse.json({ batch: updated });
  } catch (error) {
    console.error('Add student to batch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}