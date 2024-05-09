import dotenv from 'dotenv';

import logger from './util/logger';

const res = dotenv.config();
if (res.error) {
  logger.error('Failed to load .env file', res.error);
}

/**
 * Load the local .env file if it exists, this will override the global .env
 * file if there are any conflicts. This is useful for local development.
 */
const localConfig = dotenv.config({ path: '.env.local', override: true });
if (!localConfig.error) {
  logger.debug(
    'Found .env.local, loaded the config from it',
    localConfig.parsed,
  );
}
