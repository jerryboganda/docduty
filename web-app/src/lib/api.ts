/**
 * DocDuty API Client
 * Centralized HTTP client with auth token management
 * 
 * All convenience methods (get/post/put/delete) return the raw response data
 * directly on success, or throw an ApiError on failure. This means callers
 * can simply do: const data = await api.get('/endpoint') 
 */

const rawApiBase = import.meta.env.VITE_API_URL || '/api';
const API_BASE = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('docduty_access_token');
    this.refreshToken = localStorage.getItem('docduty_refresh_token');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('docduty_access_token', accessToken);
    localStorage.setItem('docduty_refresh_token', refreshToken);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('docduty_access_token');
    localStorage.removeItem('docduty_refresh_token');
    localStorage.removeItem('docduty_user');
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Internal request method — returns { data, error, status } wrapper.
   * Used by safe() for callers that need explicit error checking.
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    skipAuth = false
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Attempt token refresh on 401
      if (response.status === 401 && this.refreshToken && !skipAuth) {
        const refreshed = await this.attemptRefresh();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
          });
          const retryData = await retryResponse.json().catch(() => null);
          return { data: retryData, error: retryResponse.ok ? null : retryData?.error || 'Request failed', status: retryResponse.status };
        }
        this.clearTokens();
        window.location.href = '/login';
        return { data: null, error: 'Session expired', status: 401 };
      }

      const data = await response.json().catch(() => null);
      return {
        data: response.ok ? data : null,
        error: response.ok ? null : (data?.error || `Request failed (${response.status})`),
        status: response.status,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Network error', status: 0 };
    }
  }

  private async attemptRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.accessToken;
        localStorage.setItem('docduty_access_token', data.accessToken);
        return true;
      }
    } catch {
      // Refresh failed
    }
    return false;
  }

  /**
   * Upload a file using multipart/form-data.
   * Returns the parsed JSON response on success, throws ApiError on failure.
   */
  async uploadFile<T = any>(endpoint: string, file: File, fieldName = 'avatar'): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const formData = new FormData();
    formData.append(fieldName, file);

    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    // Do NOT set Content-Type — browser will set it with boundary for multipart

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      // Attempt token refresh on 401
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.attemptRefresh();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
          });
          const retryData = await retryResponse.json().catch(() => null);
          if (!retryResponse.ok) throw new ApiError(retryData?.error || 'Upload failed', retryResponse.status);
          return retryData as T;
        }
        this.clearTokens();
        window.location.href = '/login';
        throw new ApiError('Session expired', 401);
      }

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new ApiError(data?.error || `Upload failed (${response.status})`, response.status);
      return data as T;
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Upload failed', 0);
    }
  }

  /**
   * Direct data return methods — return T on success, throw ApiError on failure.
   * This is what most pages use: const data = await api.get('/endpoint')
   */
  async get<T = any>(endpoint: string, skipAuth = false): Promise<T> {
    const { data, error, status } = await this.request<T>('GET', endpoint, undefined, skipAuth);
    if (error) throw new ApiError(error, status);
    return data as T;
  }

  async post<T = any>(endpoint: string, body?: any, skipAuth = false): Promise<T> {
    const { data, error, status } = await this.request<T>('POST', endpoint, body, skipAuth);
    if (error) throw new ApiError(error, status);
    return data as T;
  }

  async put<T = any>(endpoint: string, body?: any): Promise<T> {
    const { data, error, status } = await this.request<T>('PUT', endpoint, body);
    if (error) throw new ApiError(error, status);
    return data as T;
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const { data, error, status } = await this.request<T>('DELETE', endpoint);
    if (error) throw new ApiError(error, status);
    return data as T;
  }

  /**
   * Safe methods — return { data, error, status } for callers that need
   * explicit error handling without try/catch.
   */
  safeGet<T = any>(endpoint: string, skipAuth = false) { return this.request<T>('GET', endpoint, undefined, skipAuth); }
  safePost<T = any>(endpoint: string, body?: any, skipAuth = false) { return this.request<T>('POST', endpoint, body, skipAuth); }
  safePut<T = any>(endpoint: string, body?: any) { return this.request<T>('PUT', endpoint, body); }
  safeDelete<T = any>(endpoint: string) { return this.request<T>('DELETE', endpoint); }
}

export const api = new ApiClient();
export type { ApiResponse };
