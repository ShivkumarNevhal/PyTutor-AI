import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { WelcomeHero } from './components/WelcomeHero';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import type {
  ChatSession,
  ChatMessage as ChatMessageType,
  BackendStatus,
} from './types';
import {
  checkBackendHealth,
  fetchDocumentList,
  postChatMessage,
} from './services/api';
import { extractCitations } from './utils/citations';
import { Bot, Loader2, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'pytutor_sessions_v1';

function createNewSession(): ChatSession {
  const now = Date.now();
  return {
    id: `session_${now}`,
    title: 'New Conversation',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [createNewSession()];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(
    () => sessions[0]?.id || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    online: false,
  });
  const [documents, setDocuments] = useState<string[]>(['python_ebook.pdf']);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  // Initial and periodic backend checks
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkBackendHealth();
      setBackendStatus(status);
      if (status.online) {
        const docs = await fetchDocumentList();
        setDocuments(docs);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isLoading]);

  const handleNewChat = () => {
    const newSession = createNewSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setErrorMessage(null);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const fresh = createNewSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all chat history?')) {
      const fresh = createNewSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    setErrorMessage(null);

    const userMessage: ChatMessageType = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: Date.now(),
    };

    // Update session title if it's the first message
    const updatedTitle =
      activeSession.messages.length === 0
        ? queryText.slice(0, 32) + (queryText.length > 32 ? '...' : '')
        : activeSession.title;

    const currentHistory = activeSession.messages;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: updatedTitle,
              updatedAt: Date.now(),
              messages: [...s.messages, userMessage],
            }
          : s
      )
    );

    setIsLoading(true);
    const startTime = performance.now();

    try {
      const response = await postChatMessage(queryText, currentHistory);
      const endTime = performance.now();
      const durationSec = (endTime - startTime) / 1000;

      const answerText = response.answer || '';
      // Prefer structured backend citations, fallback to regex extraction
      const citations =
        response.citations && response.citations.length > 0
          ? response.citations
          : extractCitations(answerText);

      const assistantMessage: ChatMessageType = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: answerText,
        timestamp: Date.now(),
        citations,
        responseTimeSec: durationSec,
        cached: response.cached,
        fastRoute: response.fast_route,
        tokens: response.tokens,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                updatedAt: Date.now(),
                messages: [...s.messages, assistantMessage],
              }
            : s
        )
      );
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to communicate with PyTutor AI backend.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = async () => {
    const docs = await fetchDocumentList();
    setDocuments(docs);
  };

  return (
    <div className="flex h-screen h-[100dvh] w-full bg-[#0a0d14] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
        documents={documents}
        backendStatus={backendStatus}
        onSelectPrompt={handleSendMessage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
        {/* Header */}
        <Header
          status={backendStatus}
          onOpenUpload={() => setIsUploadOpen(true)}
          onNewChat={handleNewChat}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Floating Open Sidebar Pill (ChatGPT-style when sidebar is closed) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="hidden md:flex absolute top-[4.5rem] left-4 z-20 items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-lg backdrop-blur-md transition-all text-xs group hover:border-emerald-500/50"
            title="Open sidebar"
          >
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            <span className="font-medium text-[11px]">Open sidebar</span>
          </button>
        )}

        {/* Backend Warning Banner if offline */}
        {!backendStatus.online && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                FastAPI backend is offline at <code className="font-mono">127.0.0.1:8000</code>. Run <code className="font-mono bg-black/40 px-1 py-0.5 rounded">python -m uvicorn src.fast_api_backend:app --reload</code>
              </span>
            </div>
            <button
              onClick={async () => {
                const s = await checkBackendHealth();
                setBackendStatus(s);
              }}
              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* Message Stream Scroll Area */}
        <div className="flex-1 overflow-y-auto">
          {activeSession.messages.length === 0 ? (
            <WelcomeHero onSelectPrompt={handleSendMessage} />
          ) : (
            <div className="flex flex-col pb-6">
              {activeSession.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="py-5 px-4 md:px-6 bg-[#111726]/40 border-y border-white/[0.04]">
                  <div className="max-w-4xl mx-auto flex gap-4 md:gap-5">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-glow-emerald">
                      <Bot className="w-4 h-4 md:w-5 md:h-5 text-white animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400 pt-1.5">
                      <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                      <span className="font-medium animate-pulse">
                        Retrieving relevant chunks & formulating answer...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div className="max-w-4xl mx-auto my-4 px-4 w-full">
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-200">Error</p>
                      <p className="text-xs text-red-300/90 mt-1">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onOpenUpload={() => setIsUploadOpen(true)}
        />
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}

export default App;
