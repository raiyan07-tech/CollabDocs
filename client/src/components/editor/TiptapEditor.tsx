import React, { useEffect, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { EditorToolbar } from './EditorToolbar';
import { ActiveUsers } from './ActiveUsers';
import { ActiveUser, Document, Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Wifi, WifiOff } from 'lucide-react';

interface TiptapEditorProps {
  document: Document;
  canEdit: boolean;
  onVersionDrawerOpen: () => void;
  onShareModalOpen: () => void;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  document: doc,
  canEdit,
}) => {
  const { user, token } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Initialize persistent Yjs doc for this session
  const ydoc = useMemo(() => new Y.Doc(), [doc.id]);

  // WebSocket URL resolution
  const wsUrl = useMemo(() => {
    const rawWsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    return `${rawWsUrl}/ws`;
  }, []);

  // Initialize WebsocketProvider with auth query params
  const provider = useMemo(() => {
    if (!token) return null;

    const wsProvider = new WebsocketProvider(
      wsUrl,
      doc.id,
      ydoc,
      {
        params: {
          token,
          doc: doc.id,
        },
      }
    );

    return wsProvider;
  }, [wsUrl, doc.id, token, ydoc]);

  // Set user awareness & listen for collaborator presence
  useEffect(() => {
    if (!provider || !user) return;

    provider.awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name,
      color: user.avatarColor || '#6366F1',
      role: doc.role,
    });

    const updateUsers = () => {
      const states = provider.awareness.getStates();
      const users: ActiveUser[] = [];
      states.forEach((state) => {
        if (state.user && state.user.name) {
          users.push(state.user as ActiveUser);
        }
      });
      setActiveUsers(users);
    };

    provider.awareness.on('change', updateUsers);
    updateUsers();

    const handleStatus = (event: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      setConnectionStatus(event.status);
    };
    provider.on('status', handleStatus);

    return () => {
      provider.awareness.off('change', updateUsers);
      provider.off('status', handleStatus);
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, user, doc.role, ydoc]);

  const editor = useEditor(
    {
      editable: canEdit,
      extensions: [
        StarterKit.configure({
          // History must be disabled when using Collaboration
          history: false,
        }),
        Placeholder.configure({
          placeholder: canEdit ? 'Type something or use formatting commands above...' : 'This document is read-only.',
        }),
        Underline,
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Collaboration.configure({
          document: ydoc,
        }),
        ...(provider
          ? [
              CollaborationCursor.configure({
                provider,
                user: {
                  name: user?.name || 'Anonymous',
                  color: user?.avatarColor || '#6366F1',
                },
              }),
            ]
          : []),
      ],
    },
    [provider, canEdit]
  );

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-white dark:bg-gray-900">
      {/* Editor Sub-header / Status */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100 dark:border-gray-800 text-xs">
        <div className="flex items-center gap-3">
          <ActiveUsers users={activeUsers} />
        </div>

        <div className="flex items-center gap-2 font-medium">
          {connectionStatus === 'connected' ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Wifi className="h-3.5 w-3.5" />
              Connected & Synced
            </span>
          ) : connectionStatus === 'connecting' ? (
            <span className="flex items-center gap-1.5 text-amber-500">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-red-500">
              <WifiOff className="h-3.5 w-3.5" />
              Disconnected
            </span>
          )}
        </div>
      </div>

      {/* Formatting Toolbar */}
      <EditorToolbar editor={editor} disabled={!canEdit} />

      {/* Editor Canvas Container (Google Docs page layout) */}
      <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-950 p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 my-2">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
