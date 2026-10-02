import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Document } from '../../types';

interface RenameDocModalProps {
  isOpen: boolean;
  document: Document | null;
  onClose: () => void;
  onSubmit: (id: string, newTitle: string) => Promise<void>;
}

export const RenameDocModal: React.FC<RenameDocModalProps> = ({
  isOpen,
  document: doc,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (doc) {
      setTitle(doc.title);
      setError('');
    }
  }, [doc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc) return;
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSubmit(doc.id, title.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to rename document');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Document"
      description="Update the document title across all collaborators."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error}
          autoFocus
        />

        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};
