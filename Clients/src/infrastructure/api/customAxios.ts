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
 * - Logs appropriate error messages based on the status code or the type of error encountered.
 *
 * This setup ensures that all HTTP requests made using this custom Axios instance are consistent in terms of configuration and error handling.
 */

import axios from "axios";
import { store } from "../../application/redux/store"; // Adjust the path to your store
const BASE_URL = "http://localhost:3000";

// Create an instance of axios with default configurations
const CustomAxios = axios.create({
  baseURL: import.meta.env.BASE_URL || BASE_URL,
  timeout: 10000, // Set a timeout limit for requests
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add authorization token to headers
CustomAxios.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  (error) => {
    if (error.response) {
      // Handle specific status codes
      switch (error.response.status) {
        case 401:
          // Handle unauthorized access
          console.error("Unauthorized access - possibly invalid token");
          break;
        case 403:
          // Handle forbidden access
          console.error("Forbidden access");
          break;
        case 500:
          // Handle server errors
          console.error("Server error");
          break;
        default:
          console.error("An error occurred:", error.response.status);
      }
    } else if (error.request) {
      // Handle no response from server
      console.error("No response received from server");
    } else {
      // Handle other errors
      console.error("Error setting up request:", error.message);
    }
    return Promise.reject(error);
  }
);

export default CustomAxios;
