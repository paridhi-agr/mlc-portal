import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getAssignmentStatus } from '@/lib/getAssignmentStatus';

// GET - Fetch assignments
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Auto-mark overdue assignments that haven't been submitted yet
    await prisma.assignment.updateMany({
      where: {
        submissionReceivedDate: null,
        dueDate: { lt: now },
        status: { not: 'overdue' },
      },
      data: { status: 'overdue' },
    });

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (session.user.role === 'student') {
      const where = batchId ? {batchId, studentId: session.user.id } : {studentId: session.user.id}
      const assignments = await prisma.assignment.findMany({
        where,
        include: {
          batch: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'desc' },
      });
      return NextResponse.json({ assignments });
    }

    if (session.user.role === 'teacher') {
      const where = batchId ? { batchId } : {};
      const assignments = await prisma.assignment.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true } },
          batch: { select: { id: true, name: true, driveFolderId: true } },
        },
        orderBy: { dueDate: 'desc' },
      });
      return NextResponse.json({ assignments });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  } catch (error) {
    console.error('Get assignments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new assignments
// Body: { batchId, studentIds, worksheetName, worksheetDescription?,
//         worksheetFolderId, worksheetFileId, worksheetFileName,
//         solutionFileId?, dueDate }
//
// worksheetFolderId is the specific HW subfolder within the batch Drive folder.
// The batch's driveFolderId is the parent — the teacher picks a subfolder from it.
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      batchId,
      studentIds,
      worksheetName,
      worksheetDescription,
      worksheetFolderId,
      worksheetFileId,
      worksheetFileName,
      solutionFileId,
      dueDate,
    } = body;

    if (
      !batchId ||
      !studentIds?.length ||
      !worksheetName ||
      !worksheetFolderId ||
      !worksheetFileId ||
      !dueDate
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the batch exists
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const safeDueDate = new Date(dueDate);
    safeDueDate.setUTCHours(12, 0, 0, 0);

    const assignment = await prisma.assignment.createMany({
      data: studentIds.map((studentId) => ({
        studentId,
        batchId,
        worksheetName,
        worksheetDescription: worksheetDescription || '',
        worksheetFolderId,
        worksheetFileId,
        worksheetFileName,
        solutionFileId: solutionFileId || null,
        dueDate: safeDueDate,
        status: 'assigned',
      })),
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Grade an assignment
// Body: { assignmentId, action: 'grade', submissionReceivedDate,
//         score?, solutionFileId?, gradedFileId? }
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assignmentId, action, submissionReceivedDate, gradedFileId, score, solutionFileId } =
      body;

    if (!assignmentId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { student: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (action === 'grade' && session.user.role === 'teacher') {
      if (!submissionReceivedDate) {
        return NextResponse.json({ error: 'submissionReceivedDate required' }, { status: 400 });
      }

      const submissionDate = new Date(submissionReceivedDate);
      const newStatus = getAssignmentStatus(assignment.dueDate, submissionDate);

      const updated = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          submissionReceivedDate: submissionDate,
          gradedFileId: gradedFileId || null,
          solutionFileId: solutionFileId || null,
          score: score !== undefined && score !== null ? parseInt(score) : null,
          status: newStatus,
        },
      });

      return NextResponse.json({ assignment: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update assignment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete an assignment
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('id');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    }

    await prisma.assignment.delete({ where: { id: assignmentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}