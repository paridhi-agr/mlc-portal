import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import mime from "mime-types";
import { Readable } from 'stream';

// Load service account credentials
const getServiceAccountAuth = () => {
  let credentials;
  if (process.env.ENV === "local") {
    const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error('service-account.json not found. Please add it to your project root.');
    }
    credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } else if (process.env.ENV === "main") {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
      throw new Error("Missing GOOGLE_SERVICE_ACCOUNT env variable");
    }
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });
};

export const getDriveInstance = async () => {
  const auth = getServiceAccountAuth();
  return google.drive({ version: 'v3', auth });
};

export const createAssignmentFolder = async (assignmentName) => {
  try {
    const drive = await getDriveInstance();
    const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    let assignmentsFolderResponse = await drive.files.list({
      q: `'${mainFolderId}' in parents and name='Assignments' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    let assignmentsFolderId;
    if (assignmentsFolderResponse.data.files.length === 0) {
      const folder = await drive.files.create({
        requestBody: {
          name: 'Assignments',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [mainFolderId],
        },
        fields: 'id',
      });
      assignmentsFolderId = folder.data.id;
    } else {
      assignmentsFolderId = assignmentsFolderResponse.data.files[0].id;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const folderName = `${assignmentName}_${timestamp}`;

    const assignmentFolder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [assignmentsFolderId],
      },
      fields: 'id, name',
    });

    return assignmentFolder.data;
  } catch (error) {
    console.error('Error creating assignment folder:', error);
    throw error;
  }
};

export const uploadToAssignmentFolder = async (fileBuffer, fileName, folderId) => {
  try {
    const drive = await getDriveInstance();
    const mimeType = mime.lookup(fileName) || "application/octet-stream";

    const response = await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType, body: Readable.from(fileBuffer) },
      fields: 'id, name, webViewLink',
    });

    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const listAssignmentFiles = async (folderId) => {
  try {
    const drive = await getDriveInstance();
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime, webViewLink, thumbnailLink)',
      orderBy: 'name',
    });
    return response.data.files || [];
  } catch (error) {
    console.error('Error listing assignment files:', error);
    throw error;
  }
};

// folderId: the batch's driveFolderId — passed explicitly so each batch
// uses its own Drive folder instead of a shared env-var root.
export const listAssignmentFolders = async (folderId) => {
  try {
    const drive = await getDriveInstance();

    // Resolve the root: use the supplied folderId, fall back to the env var
    // so the function stays backwards-compatible during migration.
    const rootFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Look for the HW_Submission subfolder within the batch root
    const hwFolderRes = await drive.files.list({
      q: `'${rootFolderId}' in parents and name='HW_Submission' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (hwFolderRes.data.files.length === 0) {
      // No HW_Submission subfolder — treat the root itself as the folder list source
      // This handles batch Drive folders that are structured differently.
      const response = await drive.files.list({
        q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name, createdTime, webViewLink)',
        orderBy: 'createdTime desc',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      return response.data.files || [];
    }

    const hwFolderId = hwFolderRes.data.files[0].id;

    const response = await drive.files.list({
      q: `'${hwFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, createdTime, webViewLink)',
      orderBy: 'createdTime desc',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return response.data.files || [];
  } catch (error) {
    console.error('Error listing assignment folders:', error);
    throw error;
  }
};

export const getFileLink = async (fileId) => {
  try {
    const drive = await getDriveInstance();
    const file = await drive.files.get({
      fileId,
      fields: 'webViewLink, webContentLink',
    });
    return file.data;
  } catch (error) {
    console.error('Error getting file link:', error);
    throw error;
  }
};

export const getEmailPrefix = (email) => {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '.');
};