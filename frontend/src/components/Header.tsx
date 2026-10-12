import React from 'react';
import { Menu, Upload, Plus, PanelLeft, ChevronRight } from 'lucide-react';
import type { BackendStatus } from '../types';

interface HeaderProps {
  status: BackendStatus;
  onOpenUpload: () => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onOpenUpload,
  onNewChat,
  onToggleSidebar,
  isSidebarOpen = true,
}) => {
  return (
    <header className="h-16 flex-shrink-0 px-3 sm:px-4 md:px-6 bg-[#0a0d14] border-b border-slate-800/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 shadow-md select-none">
      {/* Left branding section */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* ChatGPT-style Open Sidebar Button (when sidebar is hidden to the left) */}
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1 border border-slate-800 hover:border-slate-700 mr-0.5 group shadow-sm flex-shrink-0"
            title="Open sidebar"
            aria-label="Open sidebar"
          >
            <PanelLeft className="w-4 h-4 text-emerald-400 group-hover:scale-105 transition-transform" />
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>
        )}

        {/* Mobile sidebar toggle button (if sidebar is closed on mobile) */}
        {isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
            title="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Logo Icon */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-glow-emerald flex-shrink-0">
          <span className="text-xl leading-none">🐍</span>
        </div>

        {/* Title and Badges */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
            <h1 className="font-bold text-white text-base tracking-tight whitespace-nowrap">
              PyTutor AI
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
              ENTERPRISE
            </span>
            <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 whitespace-nowrap">
              ⚡ Token-Optimized
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden lg:block truncate max-w-[260px] leading-tight mt-0.5">
            Token-Efficient Python RAG
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 ml-2">
        {/* Backend status pill */}
        <div
          className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border flex-shrink-0 ${
            status.online
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/10 text-red-300 border-red-500/30'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              status.online
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-red-500'
            }`}
          />
          <span className="hidden sm:inline whitespace-nowrap">
            {status.online ? 'Online' : 'Offline'}
          </span>
          {status.online && status.llm_model && (
            <span className="hidden xl:inline text-slate-400 border-l border-slate-700 pl-2 text-[11px] font-mono whitespace-nowrap">
              {status.llm_model.replace('openai/', '')}
            </span>
          )}
        </div>

        {/* Upload Doc Action */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 transition-all hover:border-brand-500/40 flex-shrink-0 whitespace-nowrap"
          title="Upload Documents to Knowledge Base"
        >
          <Upload className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
          <span className="hidden sm:inline">Upload Docs</span>
        </button>

        {/* New Chat Action */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-brand-600 to-emerald-500 text-white shadow-glow-emerald hover:from-brand-500 hover:to-emerald-400 transition-all flex-shrink-0 whitespace-nowrap"
          title="Start New Chat Session"
        >
          <Plus className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>
    </header>
  );
};
