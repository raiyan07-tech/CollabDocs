import React, { useState, useEffect } from 'react';
import { UserPlus, Copy, Check, Trash2, Shield, Users } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { shareApi } from '../../api/share.api';
import { Collaborator, Document, Role } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  document: doc,
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const isOwner = doc.role === 'OWNER';

  const loadCollaborators = async () => {
    setIsLoading(true);
    try {
      const data = await shareApi.list(doc.id);
      setCollaborators(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load collaborators');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
      setError('');
      setEmail('');
    }
  }, [isOpen, doc.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsInviting(true);
    setError('');

    try {
      await shareApi.share(doc.id, { email: email.trim(), role });
      setEmail('');
      await loadCollaborators();
    } catch (err: any) {
      setError(err.message || 'Failed to invite collaborator');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevoke = async (userId: string) => {
    try {
      await shareApi.revoke(doc.id, userId);
      await loadCollaborators();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke collaborator');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Document"
      description={`Manage access and collaborators for "${doc.title}"`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Copy shareable link */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            readOnly
            value={window.location.href}
            className="flex-1 bg-transparent text-xs text-gray-600 dark:text-gray-300 outline-none truncate"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            icon={copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          >
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
        </div>

        {/* Invite Form (Owner Only) */}
        {isOwner ? (
          <form onSubmit={handleInvite} className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Add Collaborator
            </h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="collaborator@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<UserPlus className="h-4 w-4" />}
                />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'EDITOR' | 'VIEWER')}
                className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="EDITOR">Can Edit</option>
                <option value="VIEWER">Can View</option>
              </select>
              <Button type="submit" variant="primary" size="md" isLoading={isInviting}>
                Invite
              </Button>
            </div>
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          </form>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
            Only the document owner can invite or change collaborator permissions.
          </div>
        )}

        {/* Collaborators List */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            People with access ({collaborators.length})
          </h4>

          {isLoading ? (
            <div className="py-4 text-center text-xs text-gray-400">Loading collaborators...</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-56 overflow-y-auto pr-1">
              {collaborators.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm flex-shrink-0"
                      style={{ backgroundColor: c.user.avatarColor || '#6366F1' }}
                    >
                      {c.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {c.user.name} {c.isOwner && '(You / Owner)'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {c.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        c.role === 'OWNER'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : c.role === 'EDITOR'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {c.role}
                    </span>

                    {isOwner && !c.isOwner && (
                      <button
                        onClick={() => handleRevoke(c.userId)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Remove collaborator"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
