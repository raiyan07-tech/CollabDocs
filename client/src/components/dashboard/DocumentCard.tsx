import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, MoreVertical, Edit2, Trash2, Users, Shield } from 'lucide-react';
import { Document } from '../../types';

interface DocumentCardProps {
  document: Document;
  onRename: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onShare: (doc: Document) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  onRename,
  onDelete,
  onShare,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleBadgeColors = {
    OWNER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    EDITOR: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    VIEWER: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  };

  const isOwner = doc.role === 'OWNER';
  const canEdit = doc.role === 'OWNER' || doc.role === 'EDITOR';

  const formattedDate = new Date(doc.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-lg hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <Link
            to={`/document/${doc.id}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <div className="h-10 w-10 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {doc.title || 'Untitled Document'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Edited {formattedDate}
              </p>
            </div>
          </Link>

          {/* Action Menu Trigger */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-20 text-xs font-medium">
                {canEdit && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onRename(doc);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                    Rename
                  </button>
                )}

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onShare(doc);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                >
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  Collaborators
                </button>

                {isOwner && (
                  <>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(doc);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Snippet */}
        <p className="mt-3.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {doc.content ? doc.content.replace(/<[^>]*>?/gm, '') : 'No content yet...'}
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium ${
            roleBadgeColors[doc.role]
          }`}
        >
          <Shield className="h-3 w-3" />
          {doc.role.charAt(0) + doc.role.slice(1).toLowerCase()}
        </span>

        {doc.owner && (
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <div
              className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase"
              style={{ backgroundColor: doc.owner.avatarColor || '#6366F1' }}
            >
              {doc.owner.name.charAt(0)}
            </div>
            <span className="truncate max-w-[100px]">{doc.owner.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};
