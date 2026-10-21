import React, { useState, useRef, useEffect } from 'react';
import { 
  BotMessageSquare, 
  Send, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  User, 
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function ChatbotPage() {
  const { studentProfile, compareList } = useApp();

  const [sessionId, setSessionId] = useState(
    () => 'sess_' + Math.random().toString(36).substring(2, 9)
  );
  const [modelType, setModelType] = useState('slm');

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am **College Guide AI**, your admissions assistant for Indian engineering admissions (B.Tech / B.E.). 

I answer questions strictly using verified university brochures, fee schedules, and historical cutoffs in our database.

**What would you like to explore today?**`,
      citations: [],
      evidence_used: [],
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeEvidenceIndex, setActiveEvidenceIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const starterQuestions = [
    'Which colleges suit my qualifications?',
    'What was the CSE cutoff for CEG Anna University in previous years?',
    'Are hostel charges included in tuition for IIT Madras?',
    'Which scholarships are offered by SSN and NIT Trichy?',
    'Compare CEG Chennai and SSN College of Engineering.'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend = input) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = newMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const selectedCollegeIds = compareList.map((c) => c.id);

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
          content: 'Sorry, I encountered an error connecting to the admissions evidence engine. Please try again.',
          citations: [],
          evidence_used: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
            <BotMessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <span>College Guide AI Assistant</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Grounded RAG
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              {studentProfile
                ? `Context Active: ${studentProfile.entrance_exam} (${studentProfile.rank_or_score}) • Course: ${studentProfile.preferred_course}`
                : 'General Admissions Mode • Set profile to personalize guidance'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* SLM / LLM Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setModelType('slm')}
              title="Small Language Model: Fast, deterministic, sub-second latency"
              className={`px-2.5 py-1 rounded-md transition-all ${
                modelType === 'slm'
                  ? 'bg-white text-sky-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              SLM (Fast)
            </button>
            <button
              onClick={() => setModelType('llm')}
              title="Large Language Model: Nuanced conversational reasoning"
              className={`px-2.5 py-1 rounded-md transition-all ${
                modelType === 'llm'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              LLM (Detailed)
            </button>
          </div>

          <button
            onClick={handleClearChat}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[560px] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${
                msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${
                  msg.role === 'user'
                    ? 'bg-slate-800'
                    : 'bg-sky-600 shadow-sm shadow-sky-500/30'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <BotMessageSquare className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-3 ${
                  msg.role === 'user'
                    ? 'bg-sky-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
                }`}
              >
                {/* Content */}
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-line font-medium">
                    {msg.content}
                  </div>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}

                {/* NLP Metadata Pill */}
                {msg.role === 'assistant' && msg.intent && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-500 border-t border-slate-200/50">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono font-semibold">
                      {msg.model_used?.toUpperCase() || 'SLM'}
                    </span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-semibold border border-sky-100">
                      Intent: {msg.intent.replace(/_/g, ' ')}
                      {msg.intent_confidence ? ` (${Math.round(msg.intent_confidence * 100)}%)` : ''}
                    </span>
                    {msg.rewritten_query && (
                      <span className="italic text-slate-500 truncate max-w-xs" title={msg.rewritten_query}>
                        &bull; Context resolved: &ldquo;{msg.rewritten_query}&rdquo;
                      </span>
                    )}
                  </div>
                )}

                {/* Warning notice if in fallback mode */}
                {msg.warning && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>{msg.warning}</span>
                  </div>
                )}

                {/* Clickable Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-1">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Citations & Sources:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, i) => (
                        <a
                          key={i}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-sky-700 hover:text-sky-900 hover:bg-sky-50 text-xs font-semibold shadow-2xs transition-colors"
                        >
                          <span>{c.source_name} ({c.year})</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence Transparency Toggle */}
                {msg.evidence_used && msg.evidence_used.length > 0 && (
                  <div className="pt-1">
                    <button
                      onClick={() =>
                        setActiveEvidenceIndex(activeEvidenceIndex === index ? null : index)
                      }
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                    >
                      <BookOpen className="w-3 h-3 text-sky-600" />
                      <span>
                        {activeEvidenceIndex === index ? 'Hide' : 'Inspect'} Retrieved Evidence ({msg.evidence_used.length} sources)
                      </span>
                      {activeEvidenceIndex === index ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {activeEvidenceIndex === index && (
                      <div className="mt-2 space-y-2 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                        {msg.evidence_used.map((ev, ei) => (
                          <div key={ei} className="p-2 rounded-lg bg-white border border-slate-200 space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                              <span className="font-bold text-sky-700">{ev.document_title}</span>
                              <span>Score: {ev.relevance_score}</span>
                            </div>
                            <p className="text-slate-700 italic">"{ev.snippet}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Suggested follow ups */}
                {msg.suggested_follow_ups && msg.suggested_follow_ups.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {msg.suggested_follow_ups.map((sug, si) => (
                      <button
                        key={si}
                        onClick={() => handleSend(sug)}
                        className="px-2 py-0.5 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-medium border border-sky-200 transition-colors"
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
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white">
                <BotMessageSquare className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-4 text-xs text-slate-500 flex items-center space-x-2">
                <div className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Retrieving verified document excerpts & generating response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Starter Pills */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="font-bold text-slate-400 text-[10px] uppercase flex-shrink-0">Suggestions:</span>
          {starterQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-sky-300 text-slate-600 hover:text-sky-700 font-medium whitespace-nowrap transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Chat Input Field */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about admissions, cutoffs, tuition fees, scholarships, or comparisons..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-sm shadow-sm transition-all flex items-center space-x-1.5"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
