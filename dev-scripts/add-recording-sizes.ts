/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */

/**
 * This is a dev script to loop through all the recording folders
 * and update the recording sizes
 *
 * Usage: ts-node dev-scripts/add-recording-sizes.ts
 */

import chalk from 'chalk';
import { readFile, stat, writeFile } from 'fs/promises';
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

    for (const folder of jsonData.recordingFolders) {
      const videoPath = join(
        userDataPath,
        'video-storage',
        folder.id,
        'video.mp4',
      );
      const stats = await stat(videoPath);
      folder.recordingSize = stats.size;
    }

    console.log(chalk.green('Updated recording sizes'));
    console.log(chalk.green('Writing to file'));

    await writeFile(filePath, JSON.stringify(jsonData), 'utf8');
    console.log(chalk.green('Writing successful'));
  } catch (err) {
    console.error(chalk.red('Aborting error'), err);
  }
})();
