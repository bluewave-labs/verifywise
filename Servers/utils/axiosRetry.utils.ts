import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import logger from "./logger/fileLogger";

/**
 * Creates an Axios instance with retry logic configured
 * Retries failed requests automatically for network errors and 5xx server errors
 */
export function createAxiosWithRetry(): AxiosInstance {
  const instance = axios.create();

  // Configure retry logic
  axiosRetry(instance, {
    retries: 3, // Number of retry attempts
    retryDelay: axiosRetry.exponentialDelay, // Exponential backoff: 0ms, 100ms, 400ms, 900ms
    retryCondition: (error) => {
      // Retry on network errors or 5xx server errors
      const shouldRetry =
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        (error.response?.status !== undefined && error.response.status >= 500);

      if (shouldRetry) {
        logger.warn(
          `Retrying request to ${error.config?.url} due to ${error.code || error.response?.status}`
        );
      }

      return shouldRetry;
    },
    onRetry: (retryCount, error, requestConfig) => {
      logger.info(
        `Retry attempt ${retryCount} for ${requestConfig.url}: ${error.message}`
      );
    },
  });

  return instance;
}

/**
 * Default axios instance with retry logic for Evidently service calls
 */
export const axiosWithRetry = createAxiosWithRetry();
