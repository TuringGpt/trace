import dotenv from 'dotenv';

import logger from './util/logger';

const res = dotenv.config();
if (res.error) {
  logger.error('Failed to load .env file', res.error);
}
