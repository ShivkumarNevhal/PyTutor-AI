import React from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  BookOpen,
  Database,
  Cpu,
  Layers,
  Code2,
  FileText,
  ChevronLeft,
} from 'lucide-react';
import type { ChatSession, BackendStatus } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
  documents: string[];
  backendStatus: BackendStatus;
  onSelectPrompt: (prompt: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const EXAMPLE_PROMPTS = [
  'Explain inheritance and classes in Python with an example.',
  'What is the difference between == and is for Python lists?',
  'How do Python decorators work under the hood?',
  'Explain exception handling with try, except, finally in Python.',
  'What is the difference between a list and a tuple in Python?',
];

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll,
  documents,
  backendStatus,
  onSelectPrompt,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Collapsible Sidebar Container (ChatGPT-style slide left/right) */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 bg-[#0d121f] border-r border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden ${
          isOpen
            ? 'w-72 md:w-80 translate-x-0 opacity-100 shadow-2xl md:shadow-none'
            : 'w-0 -translate-x-full md:-translate-x-full opacity-0 pointer-events-none border-r-0'
        }`}
      >
        {/* Top Header with New Conversation & ChatGPT-style Arrow Collapse Button */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between gap-2.5 flex-shrink-0 min-w-0">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-medium text-sm shadow-glow-emerald transition-all min-w-0"
            title="Start new conversation"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">New Conversation</span>
          </button>

          {/* ChatGPT-style Collapse Arrow Button */}
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/90 transition-all border border-slate-800 hover:border-slate-700/80 flex-shrink-0 group"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-emerald-400 group-hover:-translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Scrollable Middle Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 w-72 md:w-80">
          {/* Chat Sessions */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Recent Chats
              </span>
              {sessions.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-[11px] text-slate-500 hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/60">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        if (window.innerWidth < 768) onClose();
                      }}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all ${
                        isActive
                          ? 'bg-slate-800/90 text-white font-medium border border-slate-700/80 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MessageSquare
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? 'text-brand-400' : 'text-slate-500'
                          }`}
                        />
                        <span className="truncate">{session.title}</span>
                      </div>
                      <button
                        onClick={(e) => onDeleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-red-400 transition-all"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Python Prompts */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 block mb-2">
              Explore Questions
            </span>
            <div className="space-y-1.5">
              {EXAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectPrompt(prompt);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs text-slate-300 hover:text-brand-300 bg-slate-900/50 hover:bg-slate-800/70 border border-slate-800/70 hover:border-brand-500/30 transition-all flex items-start gap-2 group"
                >
                  <Code2 className="w-3.5 h-3.5 text-brand-400 mt-0.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  <span className="line-clamp-2">{prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Knowledge Base Card */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 block mb-2">
              Knowledge Base
            </span>
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                <BookOpen className="w-4 h-4 text-brand-400" />
                <span>Indexed Sources</span>
              </div>
              <div className="space-y-1">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/50 px-2 py-1.5 rounded-lg border border-slate-700/50"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate font-mono text-[11px]">{doc}</span>
                  </div>
                ))}
              </div>

              {/* Engine Specs */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3 h-3 text-cyan-400" />
                    Vector Store:
                  </span>
                  <span className="font-mono text-slate-300">ChromaDB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-purple-400" />
                    Embedding:
                  </span>
                  <span className="font-mono text-slate-300">all-MiniLM-L6</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-emerald-400" />
                    LLM Engine:
                  </span>
                  <span className="font-mono text-slate-300">
                    {backendStatus.llm_model?.replace('openai/', '') || 'Groq Llama/GPT'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom User / Engine Footer */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/60 text-xs text-slate-400 flex items-center justify-between flex-shrink-0 w-72 md:w-80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-subtle"></span>
            <span>PyTutor Engine v2.0</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">React • FastAPI</span>
        </div>
      </aside>
    </>
  );
};
