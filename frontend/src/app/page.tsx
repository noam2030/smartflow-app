'use client';

import React, { useState } from 'react';
import { Dashboard } from '../components/Dashboard';
import { IssueForm } from '../components/IssueForm';
import { Issue } from '../types/issue';
import {
  CheckCircle,
  LayoutDashboard,
  PlusCircle,
  Zap,
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report'>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleIssueCreated = (createdIssue: Issue) => {
    // Increment trigger to reload dashboard
    setRefreshTrigger((prev) => prev + 1);
    setToastMessage(`Issue "${createdIssue.title}" created with ${createdIssue.urgency} urgency!`);

    // Clear toast after 5 seconds
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Smart<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  AI Issue Ops
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                data-testid="nav-tab-dashboard"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className={`inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'report'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700'
                }`}
                data-testid="nav-tab-report"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Report Issue
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className="flex items-center space-x-2 bg-slate-900 text-white text-xs font-medium py-2.5 px-4 rounded-xl shadow-lg border border-slate-700">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'report' ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 flex items-center"
              >
                &larr; Back to Dashboard
              </button>
            </div>
            <IssueForm
              onSuccess={(issue) => {
                handleIssueCreated(issue);
              }}
            />
          </div>
        ) : (
          <Dashboard
            refreshTrigger={refreshTrigger}
            onNavigateToForm={() => setActiveTab('report')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-600">
        SmartFlow Issue Tracker &bull; AI-Powered Classification &bull; Fastify Backend & Next.js Frontend
      </footer>
    </div>
  );
}
