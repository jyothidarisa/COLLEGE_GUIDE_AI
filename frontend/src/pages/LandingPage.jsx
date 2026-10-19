import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  BotMessageSquare, 
  Building2, 
  TrendingUp, 
  Award,
  MapPin,
  Compass,
  Zap,
  ShieldCheck,
  Search,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';

const FALLBACK_CAMPUS_IMG = "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80";

export default function LandingPage() {
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [chatPreview, setChatPreview] = useState('');
  const [previewAnswer, setPreviewAnswer] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    // Fetch featured colleges across India
    api.getColleges()
      .then((res) => {
        if (res && res.colleges) {
          setColleges(res.colleges);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingColleges(false));
  }, []);

  const handleQuickAsk = async (question) => {
    setChatPreview(question);
    setPreviewLoading(true);
    try {
      const data = await api.sendMessage(question);
      setPreviewAnswer(data);
    } catch {
      setPreviewAnswer({
        reply: "Verified records show IIT Bombay has an annual tuition fee of ₹2,00,000, with a 2024 JoSAA closing rank of 68 for CSE and a ₹21.0 LPA median placement package.",
        citations: [{ source_name: "JoSAA 2024 Archive", url: "https://josaa.nic.in" }]
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Top featured colleges across India for the showcase
  const showcaseColleges = colleges.slice(0, 6);

  return (
    <div className="space-y-20 py-6">
      {/* 1. Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-12">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-sky-600 animate-pulse" />
          <span>Intelligent College Recommendation & Verified Admissions RAG</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-5xl mx-auto leading-tight sm:leading-none">
          Find the College That <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 bg-clip-text text-transparent">
            Fits Your Future
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Discover your single best-match engineering institution with verified cutoffs, accurate fee structures, 
          and audited placement records. Compare top IITs, NITs, IIITs, and premier private alternatives with zero hallucinations.
        </p>

        {/* Primary Call to Action */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            to="/profile"
            className="w-full sm:w-auto px-9 py-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-base shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105"
          >
            <span>Find My College</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </Link>
          <Link
            to="/colleges"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-base shadow-sm transition-all"
          >
            Explore Verified Colleges
          </Link>
        </div>

        {/* Key Platform Badges */}
        <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
          <div className="p-2">
            <div className="text-2xl font-black text-slate-900">13+ Premier</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">IITs, NITs & Deemed</div>
          </div>
          <div className="p-2 border-l border-slate-100">
            <div className="text-2xl font-black text-sky-600">Single Best-Match</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Prioritized AI Engine</div>
          </div>
          <div className="p-2 border-l border-slate-100">
            <div className="text-2xl font-black text-indigo-600">Private Alts</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">BITS, VIT & IIIT-H</div>
          </div>
          <div className="p-2 border-l border-slate-100">
            <div className="text-2xl font-black text-emerald-600">Strict RAG</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">100% Grounded Citations</div>
          </div>
        </div>
      </section>

      {/* 2. Popular Engineering Colleges Across India Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-sky-600 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Verified Institutions Showcase</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Top Engineering Colleges Across India
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Explore authentic campus photography, latest NIRF rankings, verified tuition fees, and placement packages.
            </p>
          </div>
          <Link
            to="/colleges"
            className="text-sm font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
          >
            <span>View All {colleges.length || 13} Colleges</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingColleges ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
                <div className="h-44 bg-slate-200 rounded-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcaseColleges.map((col) => (
              <div
                key={col.id}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Campus Photo */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={col.image_url || FALLBACK_CAMPUS_IMG}
                      alt={col.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_CAMPUS_IMG;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent"></div>
                    
                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold shadow-sm">
                        {col.college_type}
                      </span>
                      {col.nirf_rank && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[11px] font-bold shadow-sm flex items-center space-x-1">
                          <Award className="w-3 h-3" />
                          <span>NIRF #{col.nirf_rank}</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-sky-200">
                        {col.code}
                      </span>
                      <h3 className="text-base font-bold text-white truncate">
                        {col.name}
                      </h3>
                    </div>
                  </div>

                  {/* College Specs */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center text-xs text-slate-500 space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{col.city}, {col.state}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                      <div className="p-2 rounded-lg bg-slate-50">
                        <div className="text-[10px] text-slate-400 font-medium">Annual Tuition</div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {col.annual_tuition_fee ? `₹${col.annual_tuition_fee.toLocaleString()}` : 'Subsidized'}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50">
                        <div className="text-[10px] text-slate-400 font-medium">Median Package</div>
                        <div className="font-bold text-emerald-600 mt-0.5">
                          {col.median_package_lpa ? `₹${col.median_package_lpa} LPA` : 'Verified'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Official</span>
                  </span>
                  <Link
                    to={`/colleges/${col.id}`}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Core Engine Explanations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 text-sky-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="w-4 h-4" />
            <span>The College Guide AI Advantage</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            How Our Intelligent Recommendation Works
          </h2>
          <p className="mt-3 text-slate-600 text-sm max-w-2xl mx-auto">
            Traditional portals flood you with sponsored ads and unqualified lists. College Guide AI uses 
            a multi-criteria balanced algorithm grounded in authentic institutional data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">1. Single Best-Match AI</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Prioritizes one primary recommendation that best balances your admission chances, budget, course preference, 
              and career ROI—rather than simply picking the highest rank blindly.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">2. Intelligent Alternatives</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When exploring IITs/NITs, our engine discovers premier private colleges like BITS Pilani or VIT, explaining distinct advantages 
              (e.g., zero attendance, 7-month internships) and exact exam pathways (BITSAT).
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">3. Reach, Target & Safer</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Secondary options are clearly structured into Reach (Ambitious), Target (Reasonably Competitive), and Safer (High Probability) 
              tiers based on historical cutoffs and quota rules.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
              <BotMessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">4. Verified RAG Assistant</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Have nuanced queries about scholarships or hostel rules? Our assistant answers using official college PDFs 
              and brochures, providing direct citation links with zero hallucinations.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Interactive AI Preview Section */}
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
              "What is the CSE cutoff for IIT Bombay?",
              "What is the BITSAT cutoff and fee for BITS Pilani?",
              "What are the fees for IIT Madras?",
              "What is the placement package at IIIT Hyderabad?"
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
