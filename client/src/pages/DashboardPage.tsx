import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, FileText, FolderPlus, RefreshCw } from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { Button } from '../components/common/Button';
import { DocumentCard } from '../components/dashboard/DocumentCard';
import { CreateDocModal } from '../components/dashboard/CreateDocModal';
import { RenameDocModal } from '../components/dashboard/RenameDocModal';
import { DeleteDocModal } from '../components/dashboard/DeleteDocModal';
import { ShareModal } from '../components/editor/ShareModal';
import { documentsApi } from '../api/documents.api';
import { Document } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'shared'>('all');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [docToRename, setDocToRename] = useState<Document | null>(null);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [docToShare, setDocToShare] = useState<Document | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await documentsApi.list();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreateDocument = async (title: string) => {
    const newDoc = await documentsApi.create({ title });
    setDocuments((prev) => [newDoc, ...prev]);
    navigate(`/document/${newDoc.id}`);
  };

  const handleRenameDocument = async (id: string, newTitle: string) => {
    const updated = await documentsApi.update(id, { title: newTitle });
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, title: updated.title } : d))
    );
  };

  const handleDeleteDocument = async (id: string) => {
    await documentsApi.delete(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Tab filter
      if (activeTab === 'owned' && doc.ownerId !== user?.id) return false;
      if (activeTab === 'shared' && doc.ownerId === user?.id) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(query);
        const matchesContent = doc.content?.toLowerCase().includes(query);
        return matchesTitle || matchesContent;
      }

      return true;
    });
  }, [documents, activeTab, searchQuery, user?.id]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 dark:text-white">
              My Documents
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Create, organize, and edit collaborative documents with your team.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={fetchDocuments}
              title="Refresh document list"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              New Document
            </Button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Tab Filters */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-200/60 dark:bg-gray-800/60 rounded-xl text-xs font-medium self-start">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All Documents ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab('owned')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'owned'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Created by me
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'shared'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Shared with me
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Documents Grid / Content */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl bg-gray-200/70 dark:bg-gray-800/40 animate-pulse border border-gray-200 dark:border-gray-800"
                />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-8">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
                <FolderPlus className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {searchQuery ? 'No matching documents' : 'No documents yet'}
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No documents found matching "${searchQuery}". Try a different keyword.`
                  : 'Get started by creating your first document to collaborate with others in real-time.'}
              </p>
              {!searchQuery && (
                <Button
                  variant="primary"
                  size="md"
                  className="mt-6"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsCreateOpen(true)}
                >
                  Create Document
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onRename={(d) => setDocToRename(d)}
                  onDelete={(d) => setDocToDelete(d)}
                  onShare={(d) => setDocToShare(d)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateDocModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateDocument}
      />

      <RenameDocModal
        isOpen={!!docToRename}
        document={docToRename}
        onClose={() => setDocToRename(null)}
        onSubmit={handleRenameDocument}
      />

      <DeleteDocModal
        isOpen={!!docToDelete}
        document={docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleDeleteDocument}
      />

      {docToShare && (
        <ShareModal
          isOpen={!!docToShare}
          document={docToShare}
          onClose={() => setDocToShare(null)}
        />
      )}
    </div>
  );
};
