import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';
import Cookies from 'js-cookie';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
      timeout: 30000, // Increased to 30 seconds for Render free tier cold starts
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Don't try to refresh token for login/register requests
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/register')) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            const newToken = this.getAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', token);
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    Cookies.remove('refreshToken');
  }

  private async retryRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
    // Determine retry strategy based on request type
    const isCriticalEndpoint = config.url?.includes('/auth/') || 
                              config.url?.includes('/login') || 
                              config.url?.includes('/register');
    
    const maxRetries = isCriticalEndpoint ? 3 : 2; // More retries for critical endpoints
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.client(config);
      } catch (error: any) {
        const isLastAttempt = i === maxRetries - 1;
        const isTimeoutOrNetworkError = 
          error.code === 'ECONNABORTED' || 
          error.code === 'ERR_NETWORK' || 
          error.message?.includes('timeout') ||
          error.message?.includes('Network Error');

        if (isTimeoutOrNetworkError && !isLastAttempt) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s...
          const endpoint = config.url || 'unknown';
          console.log(`🔄 Retrying ${config.method?.toUpperCase()} ${endpoint} in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  private async refreshToken(): Promise<void> {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh`,
        {},
        {
          withCredentials: true,
        }
      );

      if (response.data.success && response.data.data.accessToken) {
        this.setAccessToken(response.data.data.accessToken);
      }
    } catch (error) {
      throw error;
    }
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      // Use retry logic for all requests to handle Render cold starts
      const response: AxiosResponse<ApiResponse<T>> = await this.retryRequest(config);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // Auth methods
  async login(credentials: { email: string; password: string; rememberMe?: boolean }) {
    const response = await this.post('/auth/login', credentials);
    // Don't set token here - let AuthContext handle it to avoid race conditions
    return response;
  }

  async register(data: { name: string; email: string; password: string; role?: string }) {
    const response = await this.post('/auth/register', data);
    // Don't set token here - let AuthContext handle it to avoid race conditions
    return response;
  }

  async logout() {
    const response = await this.post('/auth/logout');
    this.clearTokens();
    return response;
  }

  async getProfile() {
    return this.get('/auth/profile');
  }

  async updateProfile(data: any) {
    return this.put('/auth/profile', data);
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.put('/auth/change-password', data);
  }

  // User methods
  async getUsers(params?: any) {
    return this.get('/users', { params });
  }

  async getUserById(id: string) {
    return this.get(`/users/${id}`);
  }

  async createUser(data: any) {
    return this.post('/users', data);
  }

  async updateUser(id: string, data: any) {
    return this.put(`/users/${id}`, data);
  }

  async deleteUser(id: string) {
    return this.delete(`/users/${id}`);
  }

  async approveStudent(id: string) {
    return this.patch(`/users/${id}/approve`);
  }

  async rejectStudent(id: string) {
    return this.patch(`/users/${id}/reject`);
  }

  async getPendingStudents() {
    return this.get('/users/pending');
  }

  // Library methods
  async getLibraries(params?: any) {
    return this.get('/libraries', { params });
  }

  async getLibraryById(id: string) {
    return this.get(`/libraries/${id}`);
  }

  async createLibrary(data: any) {
    return this.post('/libraries', data);
  }

  async updateLibrary(id: string, data: any) {
    return this.put(`/libraries/${id}`, data);
  }

  async deleteLibrary(id: string) {
    return this.delete(`/libraries/${id}`);
  }

  async getLibraryAdmins(id: string) {
    return this.get(`/libraries/${id}/admins`);
  }

  async assignAdminToLibrary(libraryId: string, userId: string) {
    return this.post(`/libraries/${libraryId}/admins/${userId}`);
  }

  async removeAdminFromLibrary(libraryId: string, userId: string) {
    return this.delete(`/libraries/${libraryId}/admins/${userId}`);
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.get('/dashboard/stats');
  }

  async getRecentActivity(limit?: number) {
    const params = limit ? { limit } : {};
    return this.get('/dashboard/activity', { params });
  }

  // Reports API methods
  async getReportsData(dateRange?: string) {
    const params = dateRange ? { dateRange } : {};
    return this.get('/reports', { params });
  }

  async getReportData(type: string, dateRange?: string) {
    const params = dateRange ? { dateRange } : {};
    return this.get(`/reports/${type}`, { params });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export const api = apiClient; // Alias for backward compatibility
export default apiClient;
