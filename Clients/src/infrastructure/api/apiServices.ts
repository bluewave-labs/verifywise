import api from './api';
import { ApiError } from '../exceptions/apiError';
import { AxiosError } from 'axios';

export const apiServices = {

  // GET request
  async get(endpoint: string, params = {}) {
    try {
      const response = await api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(error.message, error.response?.status ?? 500, error.response?.data);
      } else {
        throw new ApiError('An unknown error occurred', 500);
      }
    }
  },

  // POST request
  async post(endpoint: string, data = {}) {
    try {
      const response = await api.post(endpoint, data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(error.message, error.response?.status ?? 500, error.response?.data);
      } else {
        throw new ApiError('An unknown error occurred', 500);
      }
    }
  },

  // PATCH request
  async patch(endpoint: string, data = {}) {
    try {
      const response = await api.patch(endpoint, data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(error.message, error.response?.status ?? 500, error.response?.data);
      } else {
        throw new ApiError('An unknown error occurred', 500);
      }
    }
  },

  // DELETE request
  async delete(endpoint: string) {
    try {
      const response = await api.delete(endpoint);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(error.message, error.response?.status ?? 500, error.response?.data);
      } else {
        throw new ApiError('An unknown error occurred', 500);
      }
    }
  },
};
