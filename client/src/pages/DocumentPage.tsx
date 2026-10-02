import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  History,
  FileDown,
  Shield,
  Check,
  CloudCheck,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { TiptapEditor } from '../components/editor/TiptapEditor';
import { ShareModal } from '../components/editor/ShareModal';
import { VersionHistoryDrawer } from '../components/editor/VersionHistoryDrawer';
import { documentsApi } from '../api/documents.api';
import { Document, Role } from '../types';
import { useAuth } from '../context/AuthContext';

export const DocumentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [titleSaved, setTitleSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Drawers & Modals
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const fetchDocument = async () => {
    if (!id) return;
    try {
      const data = await documentsApi.getById(id);
      setDocument(data);
      setTitle(data.title);
    } catch (err: any) {
      setError(err.message || 'Failed to open document. It may not exist or access is restricted.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const handleTitleBlur = async () => {
    if (!id || !document) return;
    if (title.trim() === document.title || !title.trim()) {
      setTitle(document.title);
      return;
    }

    setIsSavingTitle(true);
    try {
      const updated = await documentsApi.update(id, { title: title.trim() });
      setDocument(updated);
      setTitleSaved(true);
      setTimeout(() => setTitleSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update title:', err);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const canEdit = document?.role === 'OWNER' || document?.role === 'EDITOR';

  const exportDocument = (format: 'txt' | 'md' | 'html') => {
    if (!document) return;
    let content = document.content || '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'txt') {
      content = content.replace(/<[^>]*>?/gm, '');
      mimeType = 'text/plain';
      ext = 'txt';
    } else if (format === 'md') {
      mimeType = 'text/markdown';
      ext = 'md';
    } else if (format === 'html') {
      content = `<!DOCTYPE html><html><head><title>${document.title}</title></head><body>${content}</body></html>`;
      mimeType = 'text/html';
      ext = 'html';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/\s+/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500">
        <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm">Loading document...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
          <Shield className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Cannot Access Document
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">
          {error || 'You do not have permission to view or edit this document.'}
        </p>
        <Link to="/dashboard" className="mt-6">
          <Button variant="primary" icon={<ArrowLeft className="h-4 w-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Document Top Navigation Header */}
      <header className="h-16 px-4 sm:px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4 z-30 flex-shrink-0 shadow-sm">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            to="/dashboard"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0 flex-1 max-w-lg">
            <input
              type="text"
              value={title}
              disabled={!canEdit}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
              className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-700 focus:border-brand-500 rounded-lg px-2 py-0.5 outline-none w-full truncate transition-all disabled:opacity-80"
              title="Click to rename"
            />
            <div className="flex items-center gap-2 px-2 text-[11px] text-gray-500 dark:text-gray-400">
              {isSavingTitle ? (
                <span className="text-amber-500 animate-pulse">Saving title...</span>
              ) : titleSaved ? (
                <span className="flex items-center gap-1 text-emerald-500">
                  <Check className="h-3 w-3" />
                  Title saved
                </span>
              ) : (
                <span>Auto-saved to cloud</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <ThemeToggle />

          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <Button
              variant="outline"
              size="sm"
              icon={<FileDown className="h-4 w-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="hidden sm:inline-flex"
            >
              Export
            </Button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 text-xs font-medium">
                <button
                  onClick={() => exportDocument('txt')}
                  className="w-full text-left px-3.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Plain Text (.txt)
                </button>
                <button
                  onClick={() => exportDocument('md')}
                  className="w-full text-left px-3.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Markdown (.md)
                </button>
                <button
                  onClick={() => exportDocument('html')}
                  className="w-full text-left px-3.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  HTML Document (.html)
                </button>
              </div>
            )}
          </div>

          {/* Version History Button */}
          <Button
            variant="outline"
            size="sm"
            icon={<History className="h-4 w-4" />}
            onClick={() => setIsHistoryOpen(true)}
            className="hidden sm:inline-flex"
          >
            History
          </Button>

          {/* Share Button */}
          <Button
            variant="primary"
            size="sm"
            icon={<Share2 className="h-4 w-4" />}
            onClick={() => setIsShareOpen(true)}
          >
            Share
          </Button>
        </div>
      </header>

      {/* Main Collaborative Editor Canvas */}
      <main className="flex-1 flex overflow-hidden relative">
        <TiptapEditor
          document={document}
          canEdit={canEdit}
          onVersionDrawerOpen={() => setIsHistoryOpen(true)}
          onShareModalOpen={() => setIsShareOpen(true)}
        />

        {/* Version History Side Drawer */}
        <VersionHistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          documentId={document.id}
          canEdit={canEdit}
          onRestored={fetchDocument}
        />
      </main>

      {/* Share Collaborators Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        document={document}
      />
    </div>
  );
};
