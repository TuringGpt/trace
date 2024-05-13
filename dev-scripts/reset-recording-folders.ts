/* eslint-disable no-console */
/**
 * This is a dev script to loop through all the recording folders
 * and mark them as isUploaded false and isUploading false
 *
 * This is useful when you want to reset the recording folders
 *
 * We  can later on add command line arguments to improve this script
 * as needed
 *
 * Usage: ts-node dev-scripts/reset-recording-folders.ts
 */
import chalk from 'chalk';
import { readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

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

    console.log(chalk.green('Reading file'), chalk.yellow(filePath));
    const data = await readFile(filePath, 'utf8');
    console.log(chalk.green('Reading successful'));
    const jsonData = JSON.parse(data);
    console.log(chalk.green('Data parsed'));
    jsonData.recordingFolders = jsonData.recordingFolders.map((folder: any) => {
      folder.isUploaded = false;
      folder.isUploading = false;
      return folder;
    });
    console.log(chalk.green('Resetting recording folders'));
    console.log(chalk.green('Writing to file'));

    await writeFile(filePath, JSON.stringify(jsonData), 'utf8');
    console.log(chalk.green('Writing successful'));
  } catch (err) {
    console.error(chalk.red('Aborting error'), err);
  }
})();
