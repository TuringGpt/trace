import { app, dialog } from 'electron';
import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import lockFile, { lock, LockOptions } from 'proper-lockfile';

import {
  RecordedFolder,
  StorageApplicationState,
  StorageApplicationStateSchema,
} from '../types/customTypes';
import logError from './util/error-utils';
import logger from './util/logger';
import getVideoStoragePath from './util/videoStorage';

const log = logger.child({ module: 'storage' });

const fileName = 'application-state.json';

const unlockOptions = {
  lockfilePath: `${app.getPath('userData')}/appStorage.lock`,
};

const lockRetryOptions: LockOptions = {
  retries: {
    retries: 10,
  },
  ...unlockOptions,
};

const emptyInitialState: StorageApplicationState = {
  isRecording: false,
  recordingFolders: [],
};

async function reviveStorageOnCorruption() {
  const appStatePath = path.join(app.getPath('userData'), fileName);

  try {
    log.info('Reviving storage on corruption');
    if (!fs.existsSync(appStatePath)) {
      log.warn(
        'Application state file not found. Initializing with empty state.',
        { emptyInitialState },
      );
      fs.writeFileSync(appStatePath, JSON.stringify(emptyInitialState), 'utf8');
      return emptyInitialState;
    }

    const corruptAppStateJson = fs.readFileSync(
      path.join(app.getPath('userData'), 'application-state.json'),
      'utf8',
    );
    log.error('Corrupt file found. Reviving storage from available folders.', {
      corruptAppStateJson,
    });

    const videoStoragePath = getVideoStoragePath();
    log.info('Checking folders inside video storage path');
    const folders = fs.readdirSync(videoStoragePath, { withFileTypes: true });
    const recordingFolders: RecordedFolder[] = folders
      .filter((folder) => folder.isDirectory())
      .map((folder): RecordedFolder => {
        return {
          id: folder.name,
          folderName: folder.name,
          isUploaded: false,
          recordingStartedAt: Date.now(),
          uploadingInProgress: false,
        };
      });

    const data: StorageApplicationState = {
      isRecording: false,
      recordingFolders,
    };

    const res = StorageApplicationStateSchema.safeParse(data);
    if (!res.success) {
      log.error('Failed to validate revived data', { data });
      return emptyInitialState;
    }

    fs.writeFileSync(appStatePath, JSON.stringify(res.data), 'utf8');
    log.info('Corrupt file revived successfully with data', { data });

    return data;
  } catch (error) {
    logError('Error reviving storage on corruption', error);
    throw error;
  }
}

class DB {
  data: StorageApplicationState | undefined;

  filePath: string;

  constructor() {
    try {
      this.filePath = path.join(app.getPath('userData'), fileName);
      if (!fs.existsSync(this.filePath)) {
        log.info(`Cannot find file at ${this.filePath}. Creating it.`);
        fs.writeFileSync(
          this.filePath,
          JSON.stringify(emptyInitialState),
          'utf8',
        );
      }
    } catch (err) {
      log.error('Error creating file while initializing db', { err });
      throw err;
    }
  }

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    try {
      await lock(this.filePath, lockRetryOptions);
      return await fn();
    } finally {
      await this.unLockStorageFile();
    }
  }

  /**
   * Load will be called on app start to load the data from file
   * if load fails at the start, the app will not start
   * so we can safely assume that the data will be loaded post app start
   */
  async load() {
    try {
      return await this.withLock(async (): Promise<StorageApplicationState> => {
        log.info('Loading data from file');
        const data = await readFile(this.filePath, 'utf8');
        const validatedData = StorageApplicationStateSchema.parse(
          JSON.parse(data),
        );
        this.data = validatedData;
        return validatedData;
      });
    } catch (err) {
      logError('Error loading data from file', err);
      await this.handleCorruptedData();
      return this.data || emptyInitialState;
    }
  }

  private async unLockStorageFile() {
    try {
      if (fs.existsSync(unlockOptions.lockfilePath) === false) {
        log.info('Lock file does not exist. Nothing to unlock.');
        return;
      }

      if (await lockFile.check(this.filePath, unlockOptions)) {
        await lockFile.unlock(this.filePath, unlockOptions);
      }
    } catch (err) {
      log.error('Error unlocking storage file in unLockStorageFile', { err });
      throw err;
    }
  }

  private async handleCorruptedData() {
    try {
      const response = await dialog.showMessageBox({
        type: 'error',
        title: 'Error loading data',
        message:
          'Error loading data from file. \n' +
          `Resetting app data deletes all upload progress. \n` +
          'Do you want to reset the app?',
        buttons: ['Reset', 'Quit'],
      });
      if (response.response === 0) {
        this.data = await reviveStorageOnCorruption();
        await this.#save();
      } else {
        log.error('User does not want to reset the app. Quitting.');
        app.quit();
      }
    } catch (error) {
      logError('Error handling corrupted data', error);
      throw error;
    }
  }

  async save(data: StorageApplicationState) {
    this.data = data;
    await this.#save();
  }

  async #save() {
    return this.withLock(async () => {
      try {
        log.info('Saving data to file');
        const validatedData = StorageApplicationStateSchema.parse(this.data);
        await fs.promises.writeFile(
          this.filePath,
          JSON.stringify(validatedData),
          'utf8',
        );
      } catch (err) {
        logError('Error saving application state to file', err);
        throw err;
      }
    });
  }

  async saveProperty<Key extends keyof StorageApplicationState>(
    key: Key,
    value: StorageApplicationState[Key],
  ) {
    try {
      log.info(`Saving property with value`, {
        key,
        value,
      });
      this.data![key] = value;
      await this.#save();
    } catch (err) {
      log.error('Error saving property', { err });
      throw err;
    }
  }

  /**
   *
   * @returns StorageApplicationState
   */
  async getData(): Promise<StorageApplicationState> {
    const data = await this.load();
    if (!data) {
      throw new Error('Data is not loaded');
    }
    this.data = data;
    return this.data;
  }
}

const storage = new DB();
export default storage;
