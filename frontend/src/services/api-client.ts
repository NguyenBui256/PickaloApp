/**
 * API client service using axios for HTTP requests.
 * Provides centralized configuration with interceptors for auth and error handling.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { APP_CONFIG } from '@constants/app-config';
import type { ApiError } from '@api-types/api-types';

/**
 * Custom request config with auth flag.
 */
interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
}

/**
 * API Client class.
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: APP_CONFIG.API_BASE_URL,
      timeout: APP_CONFIG.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors.
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const requestConfig = config as RequestConfig;

        if (!requestConfig.skipAuth) {
          try {
            const token = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          } catch (error) {
            console.warn('Failed to retrieve auth token:', error);
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as RequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 Unauthorized - token refresh
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.skipAuth
        ) {
          originalRequest._retry = true;

          try {
            const refreshToken = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

            if (refreshToken) {
              // Attempt to refresh token
              const response = await axios.post(`${APP_CONFIG.API_BASE_URL}/auth/refresh`, {
                refresh_token: refreshToken,
              });

              const { access_token } = response.data;

              // Store new tokens
              await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, access_token);

              // Update auth header and retry
              if (!originalRequest.headers) {
                originalRequest.headers = {};
              }
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return this.client(originalRequest as AxiosRequestConfig);
            }
          } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            await AsyncStorage.multiRemove([
              APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
              APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
            ]);
            // TODO: Navigate to login screen
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle API errors and return standardized error object.
   */
  private handleError(error: AxiosError<ApiError>): ApiError {
    if (error.response) {
      // Server responded with error
      return {
        detail: error.response.data?.detail || 'An error occurred. Please try again.',
        status: error.response.status,
        code: error.code,
      };
    }

    if (error.request) {
      // Request made but no response
      return {
        detail: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }

    // Request setup error
    return {
      detail: error.message || 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
    };
  }

  /**
   * GET request.
   */
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request.
   */
  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request.
   */
  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request.
   */
  async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request.
   */
  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * Upload file/form data.
   */
  async upload<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: APP_CONFIG.IMAGE_UPLOAD_TIMEOUT,
    });
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
