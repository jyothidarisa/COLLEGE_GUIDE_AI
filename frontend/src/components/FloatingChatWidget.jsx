import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BotMessageSquare, 
  Send, 
  Minus, 
  X, 
  Maximize2, 
  RotateCcw, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  User, 
  MessageSquare,
  Building2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import MarkdownRenderer from './MarkdownRenderer';

export default function FloatingChatWidget() {
  // All Hooks declared at the top (Rules of Hooks compliant)
  const location = useLocation();
  const navigate = useNavigate();

  const { 
    messages, 
    setMessages, 
    sessionId, 
    setSessionId, 
    modelType, 
    setModelType, 
    studentProfile, 
    llmConfig 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeEvidenceIndex, setActiveEvidenceIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen, isMinimized]);

  // Hook order respected: early exit for /chat page is strictly placed below all hooks
  if (location.pathname === '/chat') {
    return null;
  }

  // Page context extraction: ONLY for /colleges/:id (not for /compare or generic pages)
  let pageContextCollegeIds = [];
  let pageContextLabel = null;

  if (location.pathname.startsWith('/colleges/')) {
    const rawId = location.pathname.split('/colleges/')[1]?.split('/')[0];
    const collegeId = parseInt(rawId, 10);
    if (!isNaN(collegeId)) {
      pageContextCollegeIds = [collegeId];
      pageContextLabel = `College Context (#${collegeId})`;
    }
  }

  const handleSend = async (textToSend = input) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = newMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Pass page-specific college ID strictly when viewing a college detail page
      const selectedCollegeIds = pageContextCollegeIds;

      const res = await api.sendMessage(
        text,
        studentProfile,
        selectedCollegeIds,
        historyPayload,
        sessionId,
        modelType
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          citations: res.citations || [],
          evidence_used: res.evidence_used || [],
          is_fallback: res.is_fallback,
          warning: res.warning,
          suggested_follow_ups: res.suggested_follow_ups || [],
          intent: res.intent,
          intent_confidence: res.intent_confidence,
          rewritten_query: res.rewritten_query,
          model_used: res.model_used,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error connecting to the admissions engine. Please try again.',
          citations: [],
          evidence_used: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSessionId('sess_' + Math.random().toString(36).substring(2, 9));
    setMessages([
      {
        role: 'assistant',
        content: 'Chat session reset. Feel free to ask about cutoffs, fees, placements, and eligibility requirements.',
        citations: [],
        evidence_used: [],
      },
    ]);
  };

  const handleOpenFullPage = () => {
    setIsOpen(false);
    navigate('/chat');
  };

  // 1. Floating Launcher Button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-sky-600/30 transition-all hover:scale-105 active:scale-95 border border-sky-400/30"
          title="Open College Guide AI Chat"
        >
          <BotMessageSquare className="w-5 h-5" />
          <span className="hidden sm:inline">Ask College Guide</span>
          {pageContextLabel && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>
    );
  }

  // 2. Collapsed Title Bar (Minimized State)
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BotMessageSquare className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold truncate">College Guide AI (Minimized)</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Expand"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Full Floating Chat Panel (Responsive: mobile drawer on small screens, popup on desktop)
  return (
    <div className="fixed inset-x-2 bottom-2 top-16 sm:top-auto sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[430px] sm:h-[590px] z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
      
      {/* Header Bar */}
      <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0 border-b border-slate-800">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white flex-shrink-0 shadow-xs">
            <BotMessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-black truncate">College Guide AI</h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Grounded
              </span>
            </div>
            {pageContextLabel ? (
              <p className="text-[10px] text-sky-300 truncate flex items-center space-x-1">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{pageContextLabel}</span>
              </p>
            ) : (
              <p className="text-[10px] text-slate-400">Admissions Assistant</p>
            )}
          </div>
        </div>

        {/* Panel Controls: Full Page, Minimize, Close */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={handleOpenFullPage}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Open Full Page (/chat)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subheader: Mode Selector & Reset */}
      <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
          <button
            onClick={() => setModelType('slm')}
            className={`px-2 py-0.5 rounded transition-all ${
              modelType === 'slm'
                ? 'bg-sky-50 text-sky-700 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            SLM (Fast)
          </button>
          <button
            onClick={() => {
              if (llmConfig?.llm_enabled) {
                setModelType('llm');
              }
            }}
            disabled={!llmConfig?.llm_enabled}
            title={!llmConfig?.llm_enabled ? llmConfig?.message : "Large Language Model"}
            className={`px-2 py-0.5 rounded transition-all ${
              modelType === 'llm'
                ? 'bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                : !llmConfig?.llm_enabled
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            LLM (Detailed)
          </button>
        </div>

        <button
          onClick={handleReset}
          className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center space-x-1 font-medium"
          title="Reset session"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-slate-50/50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-2.5 ${
              msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white ${
                msg.role === 'user' ? 'bg-slate-800' : 'bg-sky-600 shadow-xs'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <BotMessageSquare className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white font-medium rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
              }`}
            >
              {msg.role === 'user' ? (
                <div className="whitespace-pre-line font-medium text-white">{msg.content}</div>
              ) : (
                <MarkdownRenderer content={msg.content} />
              )}

              {/* Model & Intent Pill */}
              {msg.role === 'assistant' && msg.intent && (
                <div className="flex flex-wrap items-center gap-1 pt-1 text-[10px] text-slate-500 border-t border-slate-100">
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono font-bold">
                    {msg.model_used || 'Local SLM'}
                  </span>
                  <span>•</span>
                  <span className="text-sky-700 font-semibold">
                    {msg.intent.replace(/_/g, ' ')}
                  </span>
                </div>
              )}

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-1.5 border-t border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-600 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Sources:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {msg.citations.map((c, i) => (
                      <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-sky-700 hover:text-sky-900 text-[10px] font-medium"
                      >
                        <span className="truncate max-w-[140px]">{c.source_name}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Follow-ups */}
              {msg.suggested_follow_ups && msg.suggested_follow_ups.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1">
                  {msg.suggested_follow_ups.map((sug, si) => (
                    <button
                      key={si}
                      onClick={() => handleSend(sug)}
                      className="px-2 py-0.5 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-medium border border-sky-200 transition-colors text-left"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <BotMessageSquare className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 text-xs text-slate-500 flex items-center space-x-2 shadow-xs">
              <div className="w-3 h-3 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Searching verified records...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-2.5 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-1.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              pageContextLabel 
                ? "Ask about this college (fees, cutoffs, placements)..." 
                : "Ask about admissions, cutoffs, fees..."
            }
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
