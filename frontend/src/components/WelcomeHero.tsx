import React from 'react';
import { BookOpen, Code2, ShieldCheck, Zap, ArrowRight, Sparkles } from 'lucide-react';

interface WelcomeHeroProps {
  onSelectPrompt: (prompt: string) => void;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({ onSelectPrompt }) => {
  const cards = [
    {
      title: 'Object-Oriented Programming',
      description: 'Explain inheritance, base classes, and polymorphism with code examples.',
      prompt: 'Explain inheritance and classes in Python with an example.',
      icon: Code2,
      badge: 'Document Grounded',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'List Equality vs Identity',
      description: 'Detailed analysis of == (value equality) vs is (object identity) in memory.',
      prompt: 'In Python, what is the difference between == and is when comparing two lists a = [1, 2] and b = [1, 2]?',
      icon: Zap,
      badge: 'General Fallback',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
    {
      title: 'Exception Handling',
      description: 'Best practices with try, except, else, finally blocks and custom errors.',
      prompt: 'How does exception handling work in Python? Give an example of try/except/finally.',
      icon: ShieldCheck,
      badge: 'Core Concepts',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    {
      title: 'Python Decorators',
      description: 'Understand higher-order functions, @wraps, and parameter decorators.',
      prompt: 'Explain Python decorators and how they work behind the scenes.',
      icon: BookOpen,
      badge: 'Advanced Python',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 flex flex-col items-center text-center animate-in fade-in duration-300">
      {/* Glow Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-6 shadow-glow-emerald">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Enterprise Python Tutor & Document Assistant</span>
      </div>

      {/* Main Title */}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
        Master Python with{' '}
        <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
          Grounded RAG Intelligence
        </span>
      </h2>

      {/* Subtitle */}
      <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
        Ask any Python question. PyTutor AI retrieves answers directly from the official Python documentation with exact citations, backed by intelligent dual-tier fallback.
      </p>

      {/* Feature Pills */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6 text-xs text-slate-300">
        <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5">
          📚 Official Tutorial PDF
        </span>
        <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5">
          ⚡ ChromaDB Vector Search
        </span>
        <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5">
          🚀 Groq Ultra-Low Latency
        </span>
      </div>

      {/* Interactive Starter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mt-10 text-left">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelectPrompt(card.prompt)}
              className="group p-4 rounded-2xl bg-[#111726]/80 hover:bg-[#161f33] border border-slate-800 hover:border-brand-500/50 shadow-lg hover:shadow-glow-emerald cursor-pointer transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${card.badgeColor}`}
                  >
                    {card.badge}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-100 text-sm group-hover:text-brand-300 transition-colors">
                  {card.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-brand-400 font-medium opacity-80 group-hover:opacity-100">
                <span>Ask this</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
