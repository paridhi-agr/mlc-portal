import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { uploadToAssignmentFolder, getEmailPrefix } from '@/lib/drive';

// GET - Fetch assignments
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (session.user.role === 'student') {
      // Students see only their assignments
      const assignments = await prisma.assignment.findMany({
        where: { studentId: session.user.id },
        orderBy: { dueDate: 'asc' },
      });

      // Update overdue status
      const now = new Date();
      const updatedAssignments = await Promise.all(
        assignments.map(async (a) => {
          if (a.status === 'assigned' && new Date(a.dueDate) < now) {
            return await prisma.assignment.update({
              where: { id: a.id },
              data: { status: 'overdue' },
            });
          }
          return a;
        })
      );

      return NextResponse.json({ assignments: updatedAssignments });
    } else if (session.user.role === 'teacher') {
      // Teachers can see all or specific student assignments
      const where = studentId ? { studentId } : {};
      const assignments = await prisma.assignment.findMany({
        where,
        include: {
          student: {
            select: { id: true, name: true, email: true },
          },
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

// POST - Create new assignment in db
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      studentIds, 
      worksheetName, 
      worksheetDescription, 
      worksheetFolderId,
      worksheetFileId,
      worksheetFileName,
      solutionFileId,
      dueDate 
    } = body;

    if (studentIds.length === 0 || !worksheetName || !worksheetFolderId || !worksheetFileId || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const assignment = await prisma.assignment.createMany({
      data: studentIds.map((studentId) => ({
        studentId,
        worksheetName,
        worksheetDescription: worksheetDescription || '',
        worksheetFolderId,
        worksheetFileId,
        worksheetFileName,
        solutionFileId: solutionFileId || null,
        dueDate: new Date(dueDate),
        status: 'assigned',
      })),
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update assignment (submit, grade, upload graded work)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assignmentId, action, solutionFileId, gradedFileId, score } = body;

    // const formData = await request.formData();
    // const file = formData.get('file');
    // const fileName = file.name;

    // const arrayBuffer = await file.arrayBuffer();
    // const fileBuffer = Buffer.from(arrayBuffer);

    // const worksheetFolderId = formData.get('worksheetFolderId');

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

    // Submit assignment (student action)
    if (action === 'markSubmitted' && session.user.role === 'student') {
      if (assignment.studentId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Upload to assignment folder
      /**
       * 1. get assignment folder id (worksheetFolderId), submission file, s_file_name (submissionFileName)
       * 2. Upload to drive
       * 3. get the s_file_id from response
       * 4. update assignment entry in db with submission details
       */

    //   const uploadResponse = await uploadToAssignmentFolder(fileBuffer, fileName, worksheetFolderId);
    //   console.log(uploadResponse)

    //   const updated = await prisma.assignment.update({
    //     where: { id: assignmentId },
    //     data: {
    //       submittedDate: new Date(),
    //       submissionFileId: uploadResponse.id,
    //       submissionFileName: fileName || 'submission.pdf',
    //       status: 'submitted',
    //     },
    //   });

      const updated = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          submittedDate: new Date(),
          status: 'submitted',
        },
      });

      return NextResponse.json({ assignment: updated });
    }

    // Upload graded work (teacher action)
    if (action === 'grade' && session.user.role === 'teacher') {
      if (!gradedFileId) {
        return NextResponse.json({ error: 'Graded file ID required' }, { status: 400 });
      }

      const updated = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          gradedFileId: gradedFileId,
          solutionFileId: solutionFileId,
          score: parseInt(score) || null,
          status: 'graded'
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

// DELETE - Delete assignment
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

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}