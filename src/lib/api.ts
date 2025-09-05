import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';
import Cookies from 'js-cookie';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
      timeout: 10000,
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

        if (error.response?.status === 401 && !originalRequest._retry) {
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
      const response: AxiosResponse<ApiResponse<T>> = await this.client(config);
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
  async login(credentials: { email: string; password: string }) {
    const response = await this.post('/auth/login', credentials);
    if (response.success && response.data?.accessToken) {
      this.setAccessToken(response.data.accessToken);
    }
    return response;
  }

  async register(data: { name: string; email: string; password: string; role?: string }) {
    const response = await this.post('/auth/register', data);
    if (response.success && response.data?.accessToken) {
      this.setAccessToken(response.data.accessToken);
    }
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
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;
