import axios from "axios";

// Create an instance of axios with default configurations
const CustomedAxios = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL || "http://localhost:3000",
  timeout: 10000, // Set a timeout limit for requests
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add authorization token to headers
CustomedAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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
CustomedAxios.interceptors.response.use(
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

export default CustomedAxios;
