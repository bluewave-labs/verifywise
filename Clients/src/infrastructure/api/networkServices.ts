import CustomAxios from "./customAxios";
import CustomException from "../exceptions/customeException";
import { AxiosError } from "axios";

// Define types for request parameters and response data
interface RequestParams {
  [key: string]: any;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// Utility function to handle errors
const handleError = (error: any) => {
  if (error instanceof AxiosError) {
    throw new CustomException(error.message);
  } else {
    throw new CustomException("An unknown error occurred");
  }
};

// Logging function
const logRequest = (
  method: string,
  endpoint: string,
  params?: any,
  data?: any
) => {
  console.log(`[API Request] ${method.toUpperCase()} ${endpoint}`, {
    params,
    data,
  });
};

const logResponse = (method: string, endpoint: string, response: any) => {
  console.log(`[API Response] ${method.toUpperCase()} ${endpoint}`, response);
};

export const apiServices = {
  // GET request
  async get<T>(
    endpoint: string,
    params: RequestParams = {}
  ): Promise<ApiResponse<T>> {
    logRequest("get", endpoint, params);
    try {
      const response = await CustomAxios.get(endpoint, { params });
      logResponse("get", endpoint, response);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      handleError(error);
      return undefined as unknown as ApiResponse<T>;
    }
  },

  // POST request
  async post<T>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    logRequest("post", endpoint, undefined, data);
    try {
      const response = await CustomAxios.post(endpoint, data);
      logResponse("post", endpoint, response);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      handleError(error);
      return undefined as unknown as ApiResponse<T>;
    }
  },

  // PATCH request
  async patch<T>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    logRequest("patch", endpoint, undefined, data);
    try {
      const response = await CustomAxios.patch(endpoint, data);
      logResponse("patch", endpoint, response);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      handleError(error);
      return undefined as unknown as ApiResponse<T>;
    }
  },

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    logRequest("delete", endpoint);
    try {
      const response = await CustomAxios.delete(endpoint);
      logResponse("delete", endpoint, response);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      handleError(error);
      return undefined as unknown as ApiResponse<T>;
    }
  },
};
