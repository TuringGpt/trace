import { ZodError } from 'zod';
import logger from './logger';

const log = logger.child({ module: 'error-utils' });
export default function logError(message: string, inputError: unknown) {
  if (inputError instanceof ZodError) {
    log.error(message, {
      error: inputError,
      noOfErrors: inputError.errors.length,
    });
    inputError.errors.forEach((error) => {
      log.error(message, {
        message: error.message,
        path: error.path.join(','),
      });
    });
  } else if (inputError instanceof Error) {
    log.error(message, {
      errorMessage: inputError.message,
      errorStack: inputError.stack,
      fullError: inputError,
    });
  } else {
    log.error(message, {
      errorMessage: inputError,
    });
  }
}
