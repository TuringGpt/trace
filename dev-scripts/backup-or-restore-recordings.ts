/* eslint-disable no-console */
/**
 * This is a dev script to loop through all the recording folders
 * and application-state.json file and backup these into a temp folder
 * in the downloads folder when command line argument is backup
 * and restore the backup when command line argument is restore
 *
 * Usage: ts-node dev-scripts/back-up-or-restore-recordings.ts backup
 * Usage: ts-node dev-scripts/back-up-or-restore-recordings.ts restore
 */
import chalk from 'chalk';
import { existsSync } from 'fs';
import { copyFile, cp, mkdir, readdir, rename, rmdir } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

const backupOrRestore = process.argv[2];
(async () => {
  try {
    // check os, if it is not mac, then quit
    if (process.platform !== 'darwin') {
      console.error(chalk.red('This script is only supported on mac for now'));
      process.exit(1);
    }

    const userDataPath = join(
      homedir(),
      'Library',
      'Application Support',
      'Electron',
    );

    const filePath = join(userDataPath, 'application-state.json');
    const recordingFoldersPath = join(userDataPath, 'video-storage');
    const backupFolderPath = join(homedir(), 'Downloads', 'trace-backup');

    if (backupOrRestore === 'backup') {
      console.log(chalk.green('Backing up files'));
      await mkdir(backupFolderPath, { recursive: true });
      await copyFile(
        filePath,
        join(backupFolderPath, 'application-state.json'),
      );

      const recordingFolders = await readdir(recordingFoldersPath);
      console.log(chalk.green('Copying recording folders'), {
        recordingFolders,
      });
      const backupPromises = recordingFolders.map(async (folder) => {
        return cp(
          join(recordingFoldersPath, folder),
          join(backupFolderPath, folder),
          { recursive: true },
        );
      });
      await Promise.all(backupPromises);

      console.log(chalk.green('Backup successful'));
    } else if (backupOrRestore === 'restore') {
      console.log(chalk.green('Restoring files'));

      // Delete the video-storage folder if it exists
      if (existsSync(recordingFoldersPath)) {
        await rmdir(recordingFoldersPath, { recursive: true });
        console.log(chalk.green('Existing video-storage folder deleted'));
      }

      // Create a fresh video-storage folder
      await mkdir(recordingFoldersPath, { recursive: true });
      console.log(chalk.green('Fresh video-storage folder created'));

      await rename(join(backupFolderPath, 'application-state.json'), filePath);

      const backupFolders = await readdir(backupFolderPath);
      const restorePromises = backupFolders.map((folder) =>
        rename(
          join(backupFolderPath, folder),
          join(recordingFoldersPath, folder),
        ),
      );
      await Promise.all(restorePromises);

      console.log(chalk.green('Restore successful'));

      // Delete the trace-backup folder
      await rmdir(backupFolderPath, { recursive: true });
      console.log(chalk.green('Backup folder deleted'));
    } else {
      console.error(chalk.red('Invalid command. Use "backup" or "restore".'));
      process.exit(1);
    }
  } catch (err) {
    console.error(chalk.red('Aborting error'), err);
  }
})();
