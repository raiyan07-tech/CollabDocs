export type Role = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  createdAt?: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    avatarColor: string;
  };
  role: Role;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarColor: string;
  };
  role: Role;
  isOwner: boolean;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  title: string;
  content: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatarColor: string;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ActiveUser {
  id: string;
  name: string;
  color: string;
  role: Role;
}
