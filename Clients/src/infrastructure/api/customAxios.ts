/**
 * @file customAxios.ts
 * @description This file sets up a custom Axios instance with default configurations, including base URL, timeout, and headers.
 * It also includes request and response interceptors to handle authorization tokens and error responses.
 *
 * The custom Axios instance is configured with:
 * - A base URL that defaults to "http://localhost:3000" but can be overridden by the environment variable `REACT_APP_BASE_URL`.
 * - A timeout limit of 10,000 milliseconds for requests.
 * - Default headers for "Content-Type" and "Accept" set to "application/json".
 *
 * The request interceptor:
 * - Retrieves the authorization token from the Redux store.
 * - Adds the token to the request headers if it exists.
 *
 * The response interceptor:
 * - Handles specific HTTP status codes such as 401 (Unauthorized), 403 (Forbidden), and 500 (Server Error).
 * - Handles 406 status code by attempting to refresh the token and retrying the original request.
 * - Logs appropriate error messages based on the status code or the type of error encountered.
 *
 * This setup ensures that all HTTP requests made using this custom Axios instance are consistent in terms of configuration and error handling.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { store } from "../../application/redux/store";
import { ENV_VARs } from "../../../env.vars";
import { setAuthToken } from "../../application/authentication/authSlice";

// Create an instance of axios with default configurations
const CustomAxios = axios.create({
  baseURL: ENV_VARs.URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // Don't send credentials by default
  withCredentials: false,
});

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to handle both authorization token and credentials
CustomAxios.interceptors.request.use(
  (config) => {
    // Add authorization token
    const state = store.getState();
    const token = state.auth.authToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Enable credentials for auth-related endpoints
    if (config.url?.includes('/users/login') || config.url?.includes('/users/refresh-token')) {
      config.withCredentials = true;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses and errors
CustomAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 406 (Token Expired) and we haven't tried to refresh yet
    if (error.response?.status === 406 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return CustomAxios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh token endpoint with credentials
        const response = await axios.post(
          `${ENV_VARs.URL}/users/refresh-token`,
          {},
          { withCredentials: true }
        );

        if (response.status === 200) {
          const newToken = response.data.data.token;
          store.dispatch(setAuthToken(newToken));
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return CustomAxios(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default CustomAxios;
