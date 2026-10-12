import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, BookOpen, Clock, Bot, User, Sparkles } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group w-full py-5 px-4 md:px-6 transition-colors duration-200 ${
        isUser
          ? 'bg-transparent'
          : 'bg-[#111726]/50 border-y border-white/[0.04]'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4 md:gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-1">
          {isUser ? (
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white shadow-md border border-white/10">
              <User className="w-4 h-4 md:w-5 md:h-5 text-slate-200" />
            </div>
          ) : (
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-glow-emerald border border-brand-300/30">
              <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header (Role & Metadata) */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-wide text-slate-200">
                {isUser ? 'You' : 'PyTutor AI'}
              </span>
              {!isUser && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  RAG Assistant
                </span>
              )}
              {message.cached && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  ⚡ Cached (0 tokens)
                </span>
              )}
              {message.fastRoute && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  🛡️ Guardrail Fast-Path (0 tokens)
                </span>
              )}
              {message.tokens && message.tokens.total_tokens > 0 && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                  title={`Prompt: ${message.tokens.prompt_tokens} | Completion: ${message.tokens.completion_tokens} | Tokens Saved: ${message.tokens.tokens_saved}`}
                >
                  🪙 {message.tokens.total_tokens} tokens
                  {message.tokens.tokens_saved > 0 && (
                    <span className="text-emerald-400 font-semibold ml-0.5">
                      (-{message.tokens.tokens_saved} saved)
                    </span>
                  )}
                </span>
              )}
              {message.responseTimeSec !== undefined && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/50">
                  <Clock className="w-3 h-3 text-brand-400" />
                  {message.responseTimeSec < 0.05 ? '< 50ms' : `${message.responseTimeSec.toFixed(2)}s`}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              title="Copy response"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Render Markdown Content */}
          <div className="prose prose-invert prose-slate max-w-none text-[15px] leading-relaxed text-slate-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const codeString = String(children).replace(/\n$/, '');

                  if (!inline) {
                    return (
                      <CodeBlock
                        code={codeString}
                        language={language || 'python'}
                      />
                    );
                  }

                  return (
                    <code
                      className="px-1.5 py-0.5 text-xs font-mono rounded bg-slate-800/90 text-brand-300 border border-slate-700/60"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-4 rounded-lg border border-slate-800 bg-slate-900/50">
                      <table className="min-w-full divide-y divide-slate-800 text-sm">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="px-4 py-2 text-left font-semibold text-slate-200 bg-slate-800/70">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="px-4 py-2 border-t border-slate-800/50 text-slate-300">
                      {children}
                    </td>
                  );
                },
                ul({ children }) {
                  return <ul className="list-disc pl-5 space-y-1.5 my-2.5">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-5 space-y-1.5 my-2.5">{children}</ol>;
                },
                li({ children }) {
                  return <li className="text-slate-300">{children}</li>;
                },
                p({ children }) {
                  return <p className="mb-3 last:mb-0">{children}</p>;
                },
                h1({ children }) {
                  return <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-lg font-semibold text-white mt-3 mb-2">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-base font-semibold text-slate-100 mt-3 mb-1.5">{children}</h3>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Citations Section */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-brand-400" />
                <span>Grounded Citations ({message.citations.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.citations.map((citation, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-800/80 border border-slate-700/70 hover:border-brand-500/40 text-slate-300 transition-colors shadow-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                    <span className="font-mono text-slate-200">{citation.source}</span>
                    {citation.page !== undefined && (
                      <span className="text-brand-300 font-semibold bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
                        Page {citation.page}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-slate-800 bg-[#0c101c] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs text-slate-400">
        <span className="font-mono font-medium uppercase tracking-wider text-slate-300">
          {language}
        </span>
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-emerald-200/90 leading-normal">
        <code>{code}</code>
      </pre>
    </div>
  );
};
