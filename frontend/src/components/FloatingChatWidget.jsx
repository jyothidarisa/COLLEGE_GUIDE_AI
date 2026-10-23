import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BotMessageSquare, 
  Send, 
  Minus, 
  X, 
  Maximize2, 
  RotateCcw, 
  ExternalLink, 
  ShieldCheck, 
  ChevronUp, 
  User, 
  Building2 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import MarkdownRenderer from './MarkdownRenderer';

export default function FloatingChatWidget() {
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen, isMinimized]);

  if (location.pathname === '/chat') {
    return null;
  }

  // Page context extraction: ONLY for /colleges/:id
  let pageContextCollegeIds = [];
  let pageContextLabel = null;

  if (location.pathname.startsWith('/colleges/')) {
    const rawId = location.pathname.split('/colleges/')[1]?.split('/')[0];
    const collegeId = parseInt(rawId, 10);
    if (!isNaN(collegeId)) {
      pageContextCollegeIds = [collegeId];
      pageContextLabel = `Active College Context (#${collegeId})`;
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
          content: 'Sorry, I encountered an issue retrieving the official admissions information. Please try again.',
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
        content: 'Chat session reset. Feel free to ask any question about cutoffs, fees, placements, scholarships, or college eligibility.',
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
          className="flex items-center space-x-2.5 px-4 py-3 rounded-full bg-butter-500 hover:bg-butter-600 text-charcoal font-bold text-sm shadow-warm hover:shadow transition-all hover:scale-105 active:scale-95 border border-butter-600/40"
          title="Ask Questions About Colleges"
        >
          <BotMessageSquare className="w-5 h-5 text-charcoal" />
          <span className="hidden sm:inline">Ask Questions About Colleges</span>
          {pageContextLabel && (
            <span className="w-2 h-2 rounded-full bg-butter-800 animate-pulse" />
          )}
        </button>
      </div>
    );
  }

  // 2. Collapsed Title Bar (Minimized State)
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-72 sm:w-80 bg-white rounded-2xl shadow-warm border border-beige-200 overflow-hidden">
        <div className="p-3.5 bg-cream text-charcoal flex items-center justify-between border-b border-beige-200">
          <div className="flex items-center space-x-2">
            <BotMessageSquare className="w-4 h-4 text-butter-700" />
            <span className="text-xs font-bold truncate">College Guide (Minimized)</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-butter-200 rounded text-charcoal-muted hover:text-charcoal"
              title="Expand"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-butter-200 rounded text-charcoal-muted hover:text-charcoal"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Full Floating Chat Panel
  return (
    <div className="fixed inset-x-2 bottom-2 top-16 sm:top-auto sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[580px] max-h-[85vh] z-50 flex flex-col bg-ivory rounded-2xl shadow-warm border border-beige-200 overflow-hidden text-charcoal">
      
      {/* Header Bar */}
      <div className="p-3.5 bg-white text-charcoal flex items-center justify-between flex-shrink-0 border-b border-beige-200">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-butter-400 text-charcoal flex items-center justify-center flex-shrink-0 border border-butter-500/50 shadow-xs">
            <BotMessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-black truncate text-charcoal">College Admission Guide</h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cream text-charcoal border border-beige-300">
                Official Sources
              </span>
            </div>
            {pageContextLabel ? (
              <p className="text-[10px] text-butter-800 truncate flex items-center space-x-1 font-bold">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{pageContextLabel}</span>
              </p>
            ) : (
              <p className="text-[10px] text-charcoal-muted font-medium">Admissions Assistant</p>
            )}
          </div>
        </div>

        {/* Panel Controls */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={handleOpenFullPage}
            className="p-1.5 hover:bg-cream rounded-lg text-charcoal-muted hover:text-charcoal transition-colors"
            title="Open Full Page (/chat)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-cream rounded-lg text-charcoal-muted hover:text-charcoal transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-cream rounded-lg text-charcoal-muted hover:text-charcoal transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subheader: Mode Selector & Reset */}
      <div className="px-3 py-2 bg-cream/70 border-b border-beige-200 flex items-center justify-between text-xs">
        <div className="flex items-center bg-white p-0.5 rounded-lg border border-beige-200 text-[11px] font-semibold">
          <button
            onClick={() => setModelType('slm')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              modelType === 'slm'
                ? 'bg-butter-400 text-charcoal font-bold shadow-xs'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Fast Answers
          </button>
          <button
            onClick={() => setModelType('llm')}
            title={!llmConfig?.llm_enabled ? "Detailed Guidance: Setup key or use fast mode" : "Detailed Guidance"}
            className={`px-2 py-0.5 rounded-md transition-all ${
              modelType === 'llm'
                ? 'bg-butter-400 text-charcoal font-bold shadow-xs'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Detailed Guidance
          </button>
        </div>

        <button
          onClick={handleReset}
          className="text-[11px] text-charcoal-muted hover:text-charcoal flex items-center space-x-1 font-bold"
          title="Reset session"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-ivory">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-2.5 ${
              msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white ${
                msg.role === 'user' ? 'bg-charcoal text-cream shadow-xs' : 'bg-butter-400 text-charcoal border border-butter-500/50 shadow-xs'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <BotMessageSquare className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                msg.role === 'user'
                  ? 'bg-butter-300 text-charcoal font-medium rounded-tr-none border border-butter-400/60 shadow-warm-sm'
                  : 'bg-white text-charcoal border border-beige-200 rounded-tl-none shadow-warm-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <div className="whitespace-pre-line font-medium text-charcoal">{msg.content}</div>
              ) : (
                <MarkdownRenderer content={msg.content} />
              )}

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-1.5 border-t border-beige-200 space-y-1">
                  <div className="text-[10px] font-bold text-charcoal flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-butter-700" />
                    <span>Official Sources:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {msg.citations.map((c, i) => (
                      <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-cream border border-beige-300 text-charcoal hover:bg-butter-200 text-[10px] font-bold"
                      >
                        <span className="truncate max-w-[140px]">{c.source_name}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-butter-700" />
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
                      className="px-2 py-0.5 rounded-full bg-cream hover:bg-butter-200 text-charcoal text-[10px] font-bold border border-beige-300 transition-colors text-left"
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
            <div className="w-7 h-7 rounded-lg bg-butter-400 text-charcoal border border-butter-500/50 flex items-center justify-center">
              <BotMessageSquare className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-beige-200 rounded-2xl rounded-tl-none p-3 text-xs text-charcoal-muted flex items-center space-x-2 shadow-warm-sm">
              <div className="w-3 h-3 border-2 border-butter-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Searching verified college records...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-2.5 bg-white border-t border-beige-200">
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
            className="flex-1 px-3 py-2 rounded-xl border border-beige-300 bg-ivory/50 text-xs text-charcoal placeholder-charcoal-muted/70 focus:outline-none focus:ring-2 focus:ring-butter-400 focus:border-butter-500 font-medium"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl bg-butter-500 hover:bg-butter-600 disabled:opacity-50 text-charcoal font-bold text-xs shadow-warm-sm transition-all flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
