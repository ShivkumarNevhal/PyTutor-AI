import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Sparkles, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  onOpenUpload: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onOpenUpload,
}) => {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [query]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;

    onSendMessage(query.trim());
    setQuery('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full bg-[#0a0d14]/90 backdrop-blur-md pt-2 pb-3 px-3 sm:px-4 border-t border-slate-800/80">
      {/* Standard compact searchbar width (max-w-2xl / max-w-3xl) */}
      <div className="max-w-2xl sm:max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 bg-[#111726] border border-slate-700/80 focus-within:border-brand-500/80 focus-within:ring-2 focus-within:ring-brand-500/20 rounded-2xl shadow-lg transition-all duration-200">
            {/* Upload document trigger */}
            <button
              type="button"
              onClick={onOpenUpload}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors flex-shrink-0"
              title="Upload PDF to Knowledge Base"
              aria-label="Upload PDF"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Compact auto-growing Textarea */}
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask any Python question..."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 resize-none outline-none py-1 px-1.5 max-h-36 text-sm leading-relaxed disabled:opacity-50"
            />

            {/* Compact Send button */}
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="w-8 h-8 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 text-white shadow-glow-emerald disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none hover:from-brand-500 hover:to-emerald-400 transition-all duration-200 flex-shrink-0 flex items-center justify-center"
              title="Send question"
              aria-label="Send question"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Compact Helper Footer */}
          <div className="flex items-center justify-between mt-1.5 px-2 text-[10.5px] text-slate-500">
            <span className="flex items-center gap-1 truncate">
              <Sparkles className="w-2.5 h-2.5 text-brand-400 flex-shrink-0" />
              Grounded Python RAG • Enterprise dual-tier fallback
            </span>
            <span className="hidden sm:inline-block flex-shrink-0 text-slate-500">
              <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono text-[9.5px]">Enter ↵</kbd> to send
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
