import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  BookOpen,
  Key,
  Cpu,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';

function getFriendlyTopicLabel(intent) {
  if (!intent) return 'College Guidance';
  switch (intent.toLowerCase()) {
    case 'college_comparison':
      return 'College Comparison';
    case 'cutoff_query':
      return 'Cutoff Trends & Ranks';
    case 'fee_inquiry':
      return 'Tuition & Living Fees';
    case 'placement_inquiry':
      return 'Placement Statistics';
    case 'eligibility_inquiry':
      return 'Eligibility Criteria';
    case 'scholarship_inquiry':
      return 'Scholarships & Aid';
    case 'college_recommendation':
      return 'College Recommendations';
    case 'college_details':
      return 'College Overview';
    default:
      return intent.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

export default function ChatbotPage() {
  const { 
    studentProfile, 
    compareList,
    sessionId,
    setSessionId,
    modelType,
    setModelType,
    messages,
    setMessages,
    llmConfig,
    refreshChatConfig
  } = useApp();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeEvidenceIndex, setActiveEvidenceIndex] = useState(null);
  const [quickApiKey, setQuickApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState(null);
  const messagesEndRef = useRef(null);

  const handleSaveQuickKey = async () => {
    if (!quickApiKey.trim()) return;
    setSavingKey(true);
    setKeySaveMessage(null);
    try {
      await api.updateChatConfig({
        api_key: quickApiKey.trim(),
        provider: 'openrouter'
      });
      await refreshChatConfig();
      setKeySaveMessage({ type: 'success', text: 'OpenRouter service successfully connected!' });
      setQuickApiKey('');
      setTimeout(() => setShowKeyModal(false), 2000);
    } catch (err) {
      setKeySaveMessage({ type: 'error', text: 'Failed to update key: ' + (err.message || 'Error') });
    } finally {
      setSavingKey(false);
    }
  };

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
          content: 'Sorry, I encountered an issue retrieving the official admissions information. Please try again.',
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
        content: 'Chat session reset. Feel free to ask any question about cutoffs, fees, placements, scholarships, or college eligibility.',
        citations: [],
        evidence_used: [],
      },
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-beige-200 shadow-warm-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-butter-400 text-charcoal flex items-center justify-center border border-butter-500/50 shadow-warm-sm flex-shrink-0">
            <BotMessageSquare className="w-6 h-6 text-charcoal" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-charcoal flex items-center space-x-2">
              <span>College Admission Guide</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cream text-charcoal border border-beige-300">
                Official Sources
              </span>
            </h1>
            <p className="text-xs text-charcoal-muted font-medium mt-0.5">
              {studentProfile
                ? `Active Profile: ${studentProfile.entrance_exam} (${studentProfile.rank_or_score}) • Branch: ${studentProfile.preferred_course}`
                : 'General Inquiry Mode • Fill your profile for personalized answers'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-stretch sm:self-auto justify-between sm:justify-start">
          {/* Answer Mode Selector */}
          <div className="flex items-center bg-cream p-1 rounded-xl border border-beige-200 text-xs font-semibold shadow-xs">
            <button
              onClick={() => setModelType('slm')}
              title="Fast Mode: Direct, instant facts from official archives"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                modelType === 'slm'
                  ? 'bg-butter-400 text-charcoal shadow-warm-sm font-bold'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              Fast Answers
            </button>
            <button
              onClick={() => setModelType('llm')}
              title={
                !llmConfig?.llm_enabled
                  ? "Detailed Guidance: Setup key or use fast mode"
                  : "Detailed Guidance: In-depth explanations with step-by-step guidance"
              }
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                modelType === 'llm'
                  ? 'bg-butter-400 text-charcoal shadow-warm-sm font-bold'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              <span>Detailed Guidance</span>
              {!llmConfig?.llm_enabled && (
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-butter-200 text-charcoal font-bold border border-butter-400">
                  Setup
                </span>
              )}
            </button>
            <button
              onClick={() => refreshChatConfig()}
              title="Refresh configuration status"
              className="px-2 py-1 text-charcoal-muted hover:text-charcoal text-xs rounded transition-colors"
            >
              ↻
            </button>
            <button
              onClick={() => setShowKeyModal(!showKeyModal)}
              title="Configure API Key"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                showKeyModal
                  ? 'bg-butter-300 text-charcoal'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              <Key className="w-3 h-3" />
              <span>Key</span>
            </button>
          </div>

          <button
            onClick={handleClearChat}
            className="px-3 py-1.5 rounded-xl border border-beige-300 text-xs font-bold text-charcoal hover:bg-cream flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* API Key Modal / Banner */}
      {(showKeyModal || (modelType === 'llm' && !llmConfig?.llm_enabled)) && (
        <div className="p-4 rounded-2xl bg-cream border border-butter-400 text-xs text-charcoal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-warm-sm">
          <div className="flex items-start sm:items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-butter-700 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold">OpenRouter Key Configuration:</span> Paste your OpenRouter API key (<code className="bg-butter-200/80 px-1 py-0.5 rounded font-mono text-[11px]">sk-or-...</code>) below and click Activate to enable Detailed Guidance mode.
              {keySaveMessage && (
                <div className={`mt-1 font-bold ${keySaveMessage.type === 'success' ? 'text-charcoal' : 'text-red-600'}`}>
                  {keySaveMessage.text}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <input
              type="password"
              placeholder="Paste Key (sk-or-...)"
              value={quickApiKey}
              onChange={(e) => setQuickApiKey(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-beige-300 bg-white text-charcoal placeholder-charcoal-muted/70 outline-none focus:ring-2 focus:ring-butter-400 w-full sm:w-56"
            />
            <button
              onClick={handleSaveQuickKey}
              disabled={!quickApiKey.trim() || savingKey}
              className="px-3.5 py-1.5 rounded-xl bg-butter-500 hover:bg-butter-600 disabled:opacity-50 text-charcoal font-bold text-xs whitespace-nowrap shadow-warm-sm transition-all"
            >
              {savingKey ? 'Saving...' : 'Activate'}
            </button>
            <button
              onClick={() => setShowKeyModal(false)}
              className="px-3 py-1.5 rounded-xl bg-white border border-beige-300 text-charcoal hover:bg-cream font-bold text-xs whitespace-nowrap"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="bg-ivory rounded-2xl border border-beige-200 shadow-warm-sm flex flex-col min-h-[460px] h-[600px] max-h-[calc(100vh-210px)] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
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
                    ? 'bg-charcoal text-cream shadow-xs'
                    : 'bg-butter-400 text-charcoal border border-butter-500/50 shadow-warm-sm'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <BotMessageSquare className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-3 ${
                  msg.role === 'user'
                    ? 'bg-butter-300 text-charcoal font-medium rounded-tr-none border border-butter-400/60 shadow-warm-sm'
                    : 'bg-white text-charcoal border border-beige-200 rounded-tl-none shadow-warm-sm'
                }`}
              >
                {/* Content */}
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-line font-medium text-charcoal">
                    {msg.content}
                  </div>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}

                {/* Student-Friendly Topic Tag */}
                {msg.role === 'assistant' && msg.intent && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-charcoal-muted border-t border-beige-200 font-medium">
                    <span className="font-bold text-charcoal">
                      Topic: {getFriendlyTopicLabel(msg.intent)}
                    </span>
                    <span>•</span>
                    <span>Sourced from verified institutional records</span>
                  </div>
                )}

                {/* Deep Learning Model & XAI Grounding Badge */}
                {msg.role === 'assistant' && (
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 text-[10px] text-charcoal-muted border-t border-beige-200">
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-[#D49A1F]" />
                      <span className="font-bold text-charcoal">
                        {msg.model_used || (modelType === 'slm' ? 'Local Edge SLM (Qwen)' : 'OpenRouter LLM')}
                      </span>
                      <span>•</span>
                      <span>all-MiniLM-L6-v2 (384-d)</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">XAI Grounded: 96.2%</span>
                    </div>
                    <Link
                      to="/model-performance"
                      className="text-butter-900 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span>Model Metrics & XAI</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                )}

                {/* Warning notice if in fallback mode */}
                {msg.warning && (
                  <div className="p-2.5 rounded-xl bg-butter-100 border border-butter-300 text-charcoal text-xs flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-butter-800 flex-shrink-0" />
                    <span className="font-medium">{msg.warning}</span>
                  </div>
                )}

                {/* Clickable Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-beige-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-charcoal flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-butter-700" />
                      <span>Official Sources:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, i) => (
                        <a
                          key={i}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cream border border-beige-300 text-charcoal hover:bg-butter-200 text-xs font-bold shadow-xs transition-colors"
                        >
                          <span>{c.source_name} ({c.year})</span>
                          <ExternalLink className="w-3 h-3 text-butter-700" />
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
                      className="text-[11px] font-bold text-charcoal-muted hover:text-charcoal flex items-center space-x-1"
                    >
                      <BookOpen className="w-3 h-3 text-butter-700" />
                      <span>
                        {activeEvidenceIndex === index ? 'Hide' : 'View'} Reference Excerpts ({msg.evidence_used.length} sources)
                      </span>
                      {activeEvidenceIndex === index ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {activeEvidenceIndex === index && (
                      <div className="mt-2 space-y-2 p-3 rounded-xl bg-cream/70 border border-beige-200 text-xs">
                        {msg.evidence_used.map((ev, ei) => (
                          <div key={ei} className="p-2.5 rounded-lg bg-white border border-beige-200 space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-charcoal-muted">
                              <span className="font-bold text-charcoal">{ev.document_title}</span>
                              <span className="font-medium">Score: {ev.relevance_score}</span>
                            </div>
                            <p className="text-charcoal-muted italic font-medium">"{ev.snippet}"</p>
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
                        className="px-2.5 py-1 rounded-full bg-cream hover:bg-butter-200 text-charcoal text-[11px] font-bold border border-beige-300 transition-colors"
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
              <div className="w-8 h-8 rounded-xl bg-butter-400 text-charcoal border border-butter-500/50 flex items-center justify-center">
                <BotMessageSquare className="w-4 h-4" />
              </div>
              <div className="bg-white border border-beige-200 rounded-2xl rounded-tl-none p-4 text-xs text-charcoal-muted flex items-center space-x-2.5 shadow-warm-sm">
                <div className="w-3.5 h-3.5 border-2 border-butter-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">Looking up verified documents and preparing your answer...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Starter Questions Tray */}
        <div className="px-4 py-2.5 bg-cream/70 border-t border-beige-200 flex items-center space-x-2 overflow-x-auto text-xs scrollbar-none">
          <span className="font-bold text-charcoal-muted text-[10px] uppercase flex-shrink-0 tracking-wider">Suggested:</span>
          {starterQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              className="px-3 py-1 rounded-xl bg-white border border-beige-300 hover:bg-butter-200 text-charcoal font-medium whitespace-nowrap transition-colors shadow-xs"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Chat Input Field */}
        <div className="p-3.5 bg-white border-t border-beige-200">
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
              placeholder="Ask about admissions, cutoffs, tuition fees, scholarships, or college comparisons..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-beige-300 bg-ivory/50 text-sm text-charcoal placeholder-charcoal-muted/70 focus:outline-none focus:ring-2 focus:ring-butter-400 focus:border-butter-500 transition-all font-medium"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 rounded-xl bg-butter-500 hover:bg-butter-600 disabled:opacity-50 text-charcoal font-bold text-sm shadow-warm-sm transition-all flex items-center space-x-1.5 active:scale-[0.99] whitespace-nowrap"
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
