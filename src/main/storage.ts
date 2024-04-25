import { app, DesktopCapturerSource, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import lockFile, { lock, LockOptions, UnlockOptions } from 'proper-lockfile';
import { v4 as uuidv4 } from 'uuid';
import { z, ZodError } from 'zod';

import {
  StorageApplicationState,
  StorageApplicationStateSchema,
} from '../types/customTypes';
import logger from './util/logger';

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
    return this.withLock(async () => {
      try {
        log.info('Loading data from file');
        const data = fs.readFileSync(this.filePath, 'utf8');
        this.data = StorageApplicationStateSchema.parse(JSON.parse(data));
      } catch (err) {
        if (err instanceof ZodError) {
          log.error('Error parsing data from file', {
            filePath: this.filePath,
            err,
          });
          return await this.handleCorruptedData();
        }
        log.error('Error loading data from file', { err });
        throw err;
      }
    });
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
      this.data = emptyInitialState;
      await this.#_save();
    } else {
      log.error('User does not want to reset the app. Quitting.');
      app.quit();
    }
  }

  async save(data: StorageApplicationState) {
    this.data = data;
    await this.#_save();
  }

  async #_save() {
    return this.withLock(async () => {
      try {
        log.info('Saving data to file');
        await fs.promises.writeFile(
          this.filePath,
          JSON.stringify(this.data),
          'utf8',
        );
      } catch (err) {
        log.error('Error saving data to file', { err });
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
      await this.#_save();
    } catch (err) {
      log.error('Error saving property', { err });
      throw err;
    }
  }

  async getData(
    { forceReload }: { forceReload?: boolean } = { forceReload: false },
  ): Promise<StorageApplicationState> {
    if (forceReload) {
      await this.load();
    }
    return this.data!;
  }
}

const storage = new DB();
export default storage;
