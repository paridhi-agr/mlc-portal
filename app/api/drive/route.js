import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { listAssignmentFolders, listAssignmentFiles, getFileLink } from '@/lib/drive';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'listFolders') {
      // rootFolderId is the batch's driveFolderId — scopes the listing to that batch.
      // Falls back to GOOGLE_DRIVE_FOLDER_ID env var if not provided.
      const rootFolderId = searchParams.get('rootFolderId') || undefined;
      const folders = await listAssignmentFolders(rootFolderId);
      return NextResponse.json({ folders });
    }

    if (action === 'listFiles') {
      // List files in specific assignment folder
      const folderId = searchParams.get('folderId');
      if (!folderId) {
        return NextResponse.json({ error: 'Folder ID required' }, { status: 400 });
      }
      const files = await listAssignmentFiles(folderId);
      return NextResponse.json({ files });
    }

    if (action === 'getLink') {
      const fileId = searchParams.get('fileId');
      if (!fileId) {
        return NextResponse.json({ error: 'File ID required' }, { status: 400 });
      }
      const links = await getFileLink(fileId);
      return NextResponse.json({ links });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Drive API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}