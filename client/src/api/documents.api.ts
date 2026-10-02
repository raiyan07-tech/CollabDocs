import { apiFetch } from './client';
import { Document } from '../types';

export const documentsApi = {
  list: async (): Promise<Document[]> => {
    return apiFetch<Document[]>('/api/documents');
  },

  create: async (data: { title?: string; content?: string } = {}): Promise<Document> => {
    return apiFetch<Document>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getById: async (id: string): Promise<Document> => {
    return apiFetch<Document>(`/api/documents/${id}`);
  },

  update: async (id: string, data: { title?: string; isPublic?: boolean }): Promise<Document> => {
    return apiFetch<Document>(`/api/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  },
};
