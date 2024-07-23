import axios from 'axios';
import { app } from 'electron';
import { readdir, readFile, stat, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { BACKEND_URL } from '../../constants';
import { ipc, TimeRange } from '../../types/customTypes';
import db, { generateAppStateFromFolders } from '../storage';
import getDeviceMetadata from '../util/getMetaData';
import logger, { logDirectory } from '../util/logger';
import { ipcHandle } from './typeSafeHandler';

const log = logger.child({ module: 'ipc.reportError' });

const execWithoutError = async <T>(method: string, fn: () => Promise<T>) => {
  try {
    const res = await fn();
    return res;
  } catch (error) {
    log.error(`Error creating error report in: ${method}`, { error });
    return {
      message: `Error creating error report in: ${method}`,
      error,
    };
  }
};

async function getLogsForTimeRange(timeRange: TimeRange) {
  const now = new Date();
  let startTime;

  switch (timeRange) {
    case '1hour':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '6hours':
      startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      break;
    case '1day':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    default:
      throw new Error('Invalid time range');
  }

  const logFiles = await readdir(logDirectory);

  const relevantLogs = await Promise.all(
    logFiles
      .filter((file) => file.endsWith('.log'))
      .map(async (file) => {
        const filePath = join(logDirectory, file);
        const stats = await stat(filePath);

        if (stats.mtime >= startTime) {
          const content = await readFile(filePath, 'utf-8');
          return content
            .split('\n')
            .filter((line) => line.trim() !== '')
            .map((line) => JSON.parse(line))
            .filter((l) => new Date(l.timestamp) >= startTime);
        }
        return [];
      }),
  );

  return relevantLogs
    .flat()
    .sort(
      (a, b) => Number(new Date(b.timestamp)) - Number(new Date(a.timestamp)),
    );
}

async function readAndFormatState(path: string): Promise<string> {
  const state = await readFile(path, 'utf-8');
  try {
    // Attempt to parse the state as JSON
    const parsedState = JSON.parse(state);
    return parsedState;
  } catch (error) {
    // If parsing fails, return the original state
    return state;
  }
}

async function getApplicationState() {
  let path = db?.filePath;
  if (!path) {
    path = join(app.getPath('userData'), 'application-state.json');
  }
  const state = await readAndFormatState(path);
  return state;
}

ipcHandle('report-error', async (e, description, timeRage) => {
  try {
    log.info('Creating error report');
    const meta = await execWithoutError('getDeviceMetadata', getDeviceMetadata);
    const logs = await execWithoutError(
      'getLogsForTimeRange',
      getLogsForTimeRange.bind(null, timeRage),
    );
    const applicationState = await execWithoutError(
      'getApplicationState',
      getApplicationState,
    );
    const generatedVideoStorageState = await execWithoutError(
      'getGeneratedVideoStorageState',
      async () => generateAppStateFromFolders(),
    );
    const errorReport = {
      errorDescriptionByUser: description,
      metadata: meta,
      logs,
      applicationState,
      generatedVideoStorageState,
      timeOfReport: new Date().toISOString(),
      appVersion: app.getVersion(),
    };
    const errorReportPath = join(
      logDirectory,
      `error-report-${new Date().toISOString().replace(/:/g, '-')}.json`,
    );
    await writeFile(errorReportPath, JSON.stringify(errorReport, null, 2));
    const response = await axios.get<{
      signedUrl: string;
      uuid: string;
    }>(`${BACKEND_URL}/report-error`);
    const { signedUrl, uuid } = response.data;

    log.info('Uploading error report');
    await axios.put(signedUrl, JSON.stringify(errorReport), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    log.info('Error report uploaded successfully');

    await execWithoutError('unlink', unlink.bind(null, errorReportPath));

    return ipc.success(uuid);
  } catch (error) {
    log.error('Error in report-error', error);
    return ipc.error(`Failed to report error`, error);
  }
});
