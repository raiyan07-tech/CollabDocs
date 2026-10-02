import { apiFetch } from './client';
import { AuthResponse, User } from '../types';

export const authApi = {
  signup: async (data: { email: string; password: string; name: string }): Promise<AuthResponse> => {
    return apiFetch<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    return apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },

  logout: async (refreshToken?: string): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  getMe: async (): Promise<User> => {
    return apiFetch<User>('/api/auth/me');
  },
};
