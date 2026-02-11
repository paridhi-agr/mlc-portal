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

    credentials = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  return auth;
};

// Get Google Drive instance
export const getDriveInstance = async () => {
  const auth = getServiceAccountAuth();
  const drive = google.drive({ version: 'v3', auth });
  return drive;
};

// Create assignment folder
export const createAssignmentFolder = async (assignmentName) => {
  try {
    const drive = await getDriveInstance();
    const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Find or create Assignments folder
    let assignmentsFolderResponse = await drive.files.list({
      q: `'${mainFolderId}' in parents and name='Assignments' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    let assignmentsFolderId;
    if (assignmentsFolderResponse.data.files.length === 0) {
      // Create Assignments folder
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

    // Create specific assignment folder with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
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

// Upload file to assignment folder
export const uploadToAssignmentFolder = async (fileBuffer, fileName, folderId) => {
  try {
    const drive = await getDriveInstance();
    const mimeType = mime.lookup(fileName) || "application/octet-stream";

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: mimeType,
      body: Readable.from(fileBuffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    // Make file readable by anyone with link
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// List files in assignment folder
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

// List all assignment folders
export const listAssignmentFolders = async () => {

  try {
    const drive = await getDriveInstance();
    const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Find Assignments folder
    const assignmentsFolderResponse = await drive.files.list({
      q: `'${mainFolderId}' in parents and name='HW_Submission' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (assignmentsFolderResponse.data.files.length === 0) {
      return [];
    }

    const assignmentsFolderId = assignmentsFolderResponse.data.files[0].id;

    // List all assignment folders
    const response = await drive.files.list({
      q: `'${assignmentsFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, createdTime, webViewLink)',
      orderBy: 'createdTime desc',
    });

    return response.data.files || [];
  } catch (error) {
    console.error('Error listing assignment folders:', error);
    throw error;
  }
};

// Generate shareable link for a file
export const getFileLink = async (fileId) => {
  try {
    const drive = await getDriveInstance();

    const file = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink, webContentLink',
    });

    return file.data;
  } catch (error) {
    console.error('Error getting file link:', error);
    throw error;
  }
};

// Get email prefix from full email
export const getEmailPrefix = (email) => {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '.');
};