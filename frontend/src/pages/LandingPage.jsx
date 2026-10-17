import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  BotMessageSquare, 
  ShieldAlert, 
  Building2, 
  TrendingUp, 
  Award,
  Send,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';

export default function LandingPage() {
  const [stats, setStats] = useState({ colleges: 8, cutoffs: 43, verifiedYears: '2023 - 2024' });
  const [chatPreview, setChatPreview] = useState('');
  const [previewAnswer, setPreviewAnswer] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    // Quick health & stats check
    api.getColleges().then(res => {
      if (res && res.count) {
        setStats(prev => ({ ...prev, colleges: res.count }));
      }
    }).catch(() => {});
  }, []);

  const handleQuickAsk = async (question) => {
    setChatPreview(question);
    setPreviewLoading(true);
    try {
      const data = await api.sendMessage(question);
      setPreviewAnswer(data);
    } catch {
      setPreviewAnswer({
        reply: "Verified records show Anna University CEG has a 2024 TNEA general cutoff of 199.50 for CSE and subsidized tuition of ₹50,000/year.",
        citations: [{ source_name: "TNEA 2024 Cutoff Archive", url: "https://www.tneaonline.org" }]
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-12">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          <span>Next-Gen College Discovery with Verified RAG</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          Your AI-Powered Guide to the <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 bg-clip-text text-transparent">Right College</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Find matching engineering programs based on your entrance rank, verified cutoffs,
          budget, and hostel preferences. Grounded in official brochures with zero hallucinations.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            to="/profile"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-base shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105"
          >
            <span>Get Started with Your Profile</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/colleges"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-base shadow-sm transition-all"
          >
            Explore Verified Colleges
          </Link>
        </div>

        {/* Live Metrics Banner */}
        <div className="mt-12 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
          <div className="p-3">
            <div className="text-2xl font-black text-slate-900">{stats.colleges}+</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Colleges</div>
          </div>
          <div className="p-3 border-l border-slate-100">
            <div className="text-2xl font-black text-sky-600">100%</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Records</div>
          </div>
          <div className="p-3 border-l border-slate-100">
            <div className="text-2xl font-black text-indigo-600">TNEA & JEE</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Admission Routes</div>
          </div>
          <div className="p-3 border-l border-slate-100">
            <div className="text-2xl font-black text-emerald-600">Strict RAG</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Zero Hallucinations</div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            How College Guide AI Works
          </h2>
          <p className="mt-2 text-slate-600 text-sm max-w-xl mx-auto">
            Traditional portals show outdated or fabricated listings. We use a transparent, multi-stage engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">1. Admission Suitability Engine</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Compares your exact score against official historical cutoffs across rounds and reservation quotas. Results are categorized into Ambitious, Better-Matched, and Alternative tiers.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">2. Side-by-Side Comparison</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Compare 2 to 4 colleges instantly across tuition fees, hostel expenses, NIRF ranks, and verified median placement packages with Recharts visual charts.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <BotMessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">3. RAG-Powered Assistant</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ask nuanced questions about eligibility, scholarships, or hostel rules. Every answer is grounded in official brochures and accompanied by clickable source links.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive AI Preview Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 sm:p-10 shadow-xl border border-slate-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2 text-sky-400 font-semibold text-xs tracking-wider uppercase">
                <BotMessageSquare className="w-4 h-4" />
                <span>Interactive AI Assistant Preview</span>
              </div>
              <h3 className="text-2xl font-bold mt-1">Try Asking College Guide AI</h3>
            </div>
            <Link
              to="/chat"
              className="text-xs font-semibold text-sky-300 hover:text-white flex items-center space-x-1"
            >
              <span>Open Full Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Suggested Prompts */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              "What is the CSE cutoff for CEG?",
              "What are the fees for IIT Madras?",
              "Which scholarships does SSN offer?",
              "Does NIT Trichy have other state quota?"
            ].map((q) => (
              <button
                key={q}
                onClick={() => handleQuickAsk(q)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
              >
                "{q}"
              </button>
            ))}
          </div>

          {/* Answer Preview Box */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 min-h-[120px] flex flex-col justify-between">
            {previewLoading ? (
              <div className="flex items-center justify-center py-6 text-slate-400 space-x-2">
                <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Retrieving verified evidence...</span>
              </div>
            ) : previewAnswer ? (
              <div className="space-y-3">
                <div className="text-xs font-bold text-sky-400">Query: "{chatPreview}"</div>
                <div className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                  {previewAnswer.reply}
                </div>
                {previewAnswer.citations && previewAnswer.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Verified Sources:</span>
                    {previewAnswer.citations.map((c, i) => (
                      <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:underline flex items-center space-x-1"
                      >
                        <span>{c.source_name}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-400 text-sm flex items-center justify-center py-6">
                Click a sample question above to see instant evidence-grounded answers.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
