import axios, { AxiosInstance } from 'axios';
import { BACKEND_URL } from '../../constants';
import { getTokens, setTokens, removeTokens } from './storageHelpers';
import logger from './logger';

const log = logger.child({ module: 'axiosInstance' });

let refreshPromise: Promise<any> | null = null;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const tokens = await getTokens();
    if (tokens) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      log.info('Added Authorization header to request.');
    }
    return config;
  },
  (error) => {
    log.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    log.error('Response Interceptor Error:', { message: error.message });

    if (
      error.response &&
      error.response.status === 401 &&
      // eslint-disable-next-line no-underscore-dangle
      !originalRequest._retry
    ) {
      log.info('Handling 401 error');

      if (refreshPromise) {
        log.info(
          'Token refresh already in progress. Returning original error.',
        );
        return Promise.reject(error);
      }

      // eslint-disable-next-line no-underscore-dangle
      originalRequest._retry = true;

      const tokens = await getTokens();
      if (!tokens) {
        log.error('No refresh token available, logging out.');
        await removeTokens();
        return Promise.reject(error);
      }

      refreshPromise = axios.post(`${BACKEND_URL}/refresh-token`, {
        refreshToken: tokens.refreshToken,
      });

      try {
        const response = await refreshPromise;

        log.info('Access token refreshed.');

        const { accessToken } = response.data;
        await setTokens(accessToken);

        axiosInstance.defaults.headers.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        log.error('Token refresh failed:', err);
        await removeTokens();
        return Promise.reject(err);
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
