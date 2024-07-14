import fs from 'fs';

import { ipc } from '../../types/customTypes';
import storage from '../storage';
import logger from '../util/logger';
import UploadManager from '../util/UploadManager';
import uploadZipFile from '../util/uploadToCloud';
import { ipcHandle } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.upload' });

// IPC for upload as well as upload dashboard page

ipcHandle('upload-zip-file', async (e, zipFilePath: string) => {
  try {
    const content = fs.readFileSync(zipFilePath);
    const uploadResponse = await uploadZipFile(content);
    log.info(
      `Zip file uploaded successfully. File name - ${uploadResponse.uploadedZipFileName}`,
    );
    return ipc.success(uploadResponse);
  } catch (error) {
    log.error('Failed to upload the zip file.', error);
    return ipc.error('Failed to upload the zip file.', error);
  }
});

ipcHandle('get-video-recording-folders', async () => {
  try {
    const data = await storage.getData();
    return ipc.success(data.recordingFolders);
  } catch (error) {
    log.error('Failed to get video recording folders', error);
    return ipc.error('Failed to get video recording folders', error);
  }
});

ipcHandle('start-uploading-recording', async (e, folderIds: string[]) => {
  try {
    const data = await storage.getData();
    const folders = data.recordingFolders.filter((folder) =>
      folderIds.includes(folder.id),
    );
    folders.forEach((folder) => {
      UploadManager.getInstance().startUpload(folder.id);
    });
    return ipc.success(true);
  } catch (error) {
    log.error('Failed to upload the recording', error);
    return ipc.error('Failed to upload the recording', error);
  }
});
