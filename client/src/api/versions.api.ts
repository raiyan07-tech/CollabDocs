import { apiFetch } from './client';
import { DocumentVersion } from '../types';

export const versionsApi = {
  list: async (documentId: string): Promise<DocumentVersion[]> => {
    return apiFetch<DocumentVersion[]>(`/api/documents/${documentId}/versions`);
  },

  create: async (
    documentId: string,
    data: { title?: string } = {}
  ): Promise<DocumentVersion> => {
    return apiFetch<DocumentVersion>(`/api/documents/${documentId}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  restore: async (
    documentId: string,
    versionId: string
  ): Promise<{ message: string; document: any }> => {
    return apiFetch<{ message: string; document: any }>(
      `/api/documents/${documentId}/versions/${versionId}/restore`,
      {
        method: 'POST',
      }
    );
  },
};
