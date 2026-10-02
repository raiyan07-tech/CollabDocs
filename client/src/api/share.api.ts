import { apiFetch } from './client';
import { Collaborator, Role } from '../types';

export const shareApi = {
  list: async (documentId: string): Promise<Collaborator[]> => {
    return apiFetch<Collaborator[]>(`/api/documents/${documentId}/share`);
  },

  share: async (
    documentId: string,
    data: { email: string; role: 'EDITOR' | 'VIEWER' }
  ): Promise<{ message: string; permission: any }> => {
    return apiFetch<{ message: string; permission: any }>(`/api/documents/${documentId}/share`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  revoke: async (documentId: string, userId: string): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>(`/api/documents/${documentId}/share`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  },
};
