import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Document } from '../../types';

interface DeleteDocModalProps {
  isOpen: boolean;
  document: Document | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export const DeleteDocModal: React.FC<DeleteDocModalProps> = ({
  isOpen,
  document: doc,
  onClose,
  onConfirm,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!doc) return;
    setIsLoading(true);
    setError('');

    try {
      await onConfirm(doc.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Document"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-xl text-xs">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <p>
            This action cannot be undone. This document and all its version history will be permanently deleted.
          </p>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-gray-100">"{doc?.title}"</span>?
        </p>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} isLoading={isLoading}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};
