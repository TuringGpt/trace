import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export default function getVideoStoragePath(): string {
  const appDataPath = app.getPath('userData');
  const storagePath = path.join(appDataPath, 'video-storage');

  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath);
  }

  return storagePath;
}
