import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Clock, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Navbar } from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-28 lg:pb-32">
          {/* Background gradient blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800/80 mb-6">
              <Zap className="h-3.5 w-3.5" />
              <span>Real-Time CRDT Collaboration Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-950 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
              Collaborative documents,{' '}
              <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                synchronized effortlessly
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Experience seamless multi-user document editing with live remote cursors, granular access roles, and continuous version history.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={isAuthenticated ? '/dashboard' : '/signup'}>
                <Button size="lg" variant="primary" icon={<ArrowRight className="h-5 w-5" />}>
                  {isAuthenticated ? 'Go to Dashboard' : 'Start Editing for Free'}
                </Button>
              </Link>
              <a
                href="http://localhost:5000/api/docs"
                target="_blank"
                rel="noreferrer"
              >
                <Button size="lg" variant="outline">
                  Explore Swagger API Docs
                </Button>
              </a>
            </div>

            {/* Feature highlights bar */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
              {[
                { title: 'Sub-50ms Sync', desc: 'Conflict-free Yjs CRDTs' },
                { title: 'Live Presence', desc: 'Realtime colored cursors' },
                { title: 'Role Security', desc: 'Owner, Editor & Viewer' },
                { title: 'Version Snapshots', desc: 'Instant rollback history' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{item.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-white dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
                Everything you need to write together
              </h2>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
                Engineered for speed, consistency, and intuitive collaborative workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-xl bg-brand-100 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-5">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Multi-User Presence & Cursors
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  See where your team is typing in real time. Remote carets and user name badges keep everyone in sync without stepping on edits.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Granular Role Enforcement
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Control who can edit and who can view. Permissions are strictly enforced both on HTTP endpoints and within WebSocket sync streams.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-5">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Continuous Version History
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Never worry about losing work. Name checkpoints, review historical drafts, and restore any previous version with a single click.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 bg-white dark:bg-gray-950 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">CollabDocs</span>
          </div>
          <p>MIT License &bull; Real-time collaborative document platform.</p>
        </div>
      </footer>
    </div>
  );
};
