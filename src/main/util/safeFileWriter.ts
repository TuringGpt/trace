import fs from 'fs';
import lockFile from 'proper-lockfile';

import logger from './logger';

const log = logger.child({ module: 'util.safeFileWriter' });

export async function writeToFile(filePath: string, data: string) {
  try {
    // first check if the file exists, if not create it
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '', 'utf8');
    }
    log.info(`About to acquire lock: ${filePath}`);
    await lockFile.lock(filePath);
    log.info(`Lock acquired: ${filePath}`);
    // write data to file
    fs.writeFileSync(filePath, data, 'utf8');
  } catch (error) {
    log.error(`Error writing to file: ${filePath}`, error);
  } finally {
    // await lockFile.unlock(filePath);
  }
}
