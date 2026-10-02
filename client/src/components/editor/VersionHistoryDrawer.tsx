import React, { useState, useEffect } from 'react';
import { History, X, RotateCcw, Plus, Clock } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { versionsApi } from '../../api/versions.api';
import { DocumentVersion } from '../../types';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  canEdit: boolean;
  onRestored: () => void;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  documentId,
  canEdit,
  onRestored,
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [checkpointTitle, setCheckpointTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const data = await versionsApi.list(documentId);
      setVersions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load versions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadVersions();
      setError('');
    }
  }, [isOpen, documentId]);

  const handleCreateCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      await versionsApi.create(documentId, {
        title: checkpointTitle.trim() || undefined,
      });
      setCheckpointTitle('');
      setShowCreateForm(false);
      await loadVersions();
    } catch (err: any) {
      setError(err.message || 'Failed to create snapshot');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (version: DocumentVersion) => {
    if (!window.confirm(`Are you sure you want to restore to "${version.title}"? Current edits will be preserved in a new checkpoint.`)) {
      return;
    }

    setRestoringId(version.id);
    try {
      await versionsApi.restore(documentId, version.id);
      await loadVersions();
      onRestored();
    } catch (err: any) {
      setError(err.message || 'Failed to restore version');
    } finally {
      setRestoringId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Version History
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Snapshot Action */}
      {canEdit && (
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          {!showCreateForm ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowCreateForm(true)}
            >
              Name Current Version
            </Button>
          ) : (
            <form onSubmit={handleCreateCheckpoint} className="space-y-2">
              <Input
                placeholder="Checkpoint label (e.g. v1.0 Final)"
                value={checkpointTitle}
                onChange={(e) => setCheckpointTitle(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
                  Save
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Version List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        {isLoading ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading versions...</div>
        ) : versions.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">No versions recorded yet.</div>
        ) : (
          versions.map((ver) => {
            const formattedTime = new Date(ver.createdAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={ver.id}
                className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 hover:border-brand-500/30 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {ver.title}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{formattedTime}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    v{ver.versionNumber}
                  </span>
                </div>

                {ver.createdBy && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <div
                      className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase"
                      style={{ backgroundColor: ver.createdBy.avatarColor || '#6366F1' }}
                    >
                      {ver.createdBy.name.charAt(0)}
                    </div>
                    <span className="truncate">{ver.createdBy.name}</span>
                  </div>
                )}

                {canEdit && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <button
                      onClick={() => handleRestore(ver)}
                      disabled={restoringId === ver.id}
                      className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {restoringId === ver.id ? 'Restoring...' : 'Restore this version'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
