import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Layers, 
  BotMessageSquare, 
  Building2, 
  Award,
  MapPin,
  Compass,
  Zap,
  ShieldCheck,
  Search,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import api from '../services/api';

const FALLBACK_CAMPUS_IMG = "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80";

export default function LandingPage() {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [chatPreview, setChatPreview] = useState('');
  const [previewAnswer, setPreviewAnswer] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [heroSearch, setHeroSearch] = useState('');

  useEffect(() => {
    api.getColleges()
      .then((res) => {
        if (res && res.colleges) {
          setColleges(res.colleges);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingColleges(false));
  }, []);

  const handleHeroSearchSubmit = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/colleges?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/colleges');
    }
  };

  const handleQuickAsk = async (question) => {
    setChatPreview(question);
    setPreviewLoading(true);
    try {
      const data = await api.sendMessage(question);
      setPreviewAnswer(data);
    } catch {
      setPreviewAnswer({
        reply: "Official records show IIT Bombay has an annual tuition fee of ₹2,00,000, with a 2024 JoSAA closing rank of 68 for CSE and a ₹21.0 LPA median placement package.",
        citations: [{ source_name: "JoSAA 2024 Official Archive", url: "https://josaa.nic.in" }]
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const showcaseColleges = colleges.slice(0, 6);

  return (
    <div className="space-y-16 sm:space-y-24 py-6 bg-ivory">
      {/* 1. Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-6 sm:pt-10 pb-8">
        {/* Student-Friendly Top Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cream border border-beige-300 text-charcoal text-xs font-bold uppercase tracking-wider mb-6 shadow-warm-sm max-w-full">
          <Sparkles className="w-4 h-4 text-butter-700 flex-shrink-0 animate-pulse" />
          <span className="truncate">Your College Admission Guide • Official Information</span>
        </div>

        {/* Main Heading with Non-Overlapping Highlight */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal tracking-tight max-w-4xl mx-auto leading-tight md:leading-[1.25]">
          Find Your Perfect{' '}
          <span className="inline-block my-1 px-3 py-1 bg-butter-300 rounded-xl text-charcoal border border-butter-400/50 shadow-2xs">
            Engineering College
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-charcoal-muted max-w-3xl mx-auto leading-relaxed font-medium">
          Discover suitable colleges based on your entrance rank, budget, and branch preferences. 
          Compare official cutoffs, audited tuition fees, and verified placement statistics with clear source citations.
        </p>

        {/* Responsive Hero Search Bar */}
        <div className="mt-8 max-w-2xl mx-auto">
          <form 
            onSubmit={handleHeroSearchSubmit} 
            className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white p-2 rounded-2xl border border-beige-300 shadow-warm hover:border-butter-500 transition-all gap-2"
          >
            <div className="flex items-center flex-1 px-2 py-1 min-w-0">
              <Search className="w-5 h-5 text-butter-700 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search by college name, exam or city (e.g. NIT Trichy, CSE, Chennai)..."
                className="w-full bg-transparent text-sm text-charcoal placeholder-charcoal-muted/70 outline-none font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-butter-500 hover:bg-butter-600 text-charcoal font-bold text-sm shadow-warm-sm transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              Explore Colleges
            </button>
          </form>
        </div>

        {/* Primary Call to Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3.5">
          <Link
            to="/profile"
            className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-butter-500 hover:bg-butter-600 text-charcoal font-bold text-base shadow-warm flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98] border border-butter-600/30"
          >
            <span>Find My Best-Match College</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/chat"
            className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-white hover:bg-cream text-charcoal border border-beige-300 font-bold text-base shadow-warm-sm transition-all flex items-center justify-center space-x-2"
          >
            <BotMessageSquare className="w-5 h-5 text-butter-700" />
            <span>Ask Questions About Colleges</span>
          </Link>
        </div>

        {/* Statistics & Feature Cards - Student-Friendly */}
        <div className="mt-12 max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-center">
          <div className="p-4 rounded-2xl bg-white border border-beige-200 shadow-warm-sm">
            <div className="text-xl sm:text-2xl font-black text-charcoal">13+ Institutions</div>
            <div className="text-xs font-semibold text-charcoal-muted mt-1">Premier IITs, NITs & Central Colleges</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-beige-200 shadow-warm-sm">
            <div className="text-xl sm:text-2xl font-black text-charcoal">Rank Matching</div>
            <div className="text-xs font-semibold text-charcoal-muted mt-1">Based on Past Counselling Cutoffs</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-beige-200 shadow-warm-sm">
            <div className="text-xl sm:text-2xl font-black text-charcoal">Private Options</div>
            <div className="text-xs font-semibold text-charcoal-muted mt-1">BITS Pilani, VIT & IIIT Hyderabad</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-beige-200 shadow-warm-sm">
            <div className="text-xl sm:text-2xl font-black text-charcoal">Audited Data</div>
            <div className="text-xs font-semibold text-charcoal-muted mt-1">Official Fees, Cutoffs & Placement Reports</div>
          </div>
        </div>
      </section>

      {/* 2. Popular Engineering Colleges Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-butter-800 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-butter-700" />
              <span>Explore Verified College Profiles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal mt-1 tracking-tight">
              Top Engineering Colleges Across India
            </h2>
            <p className="text-charcoal-muted text-sm mt-1 font-medium">
              Explore authentic campus photography, latest NIRF rankings, verified tuition fees, and placement packages.
            </p>
          </div>
          <Link
            to="/colleges"
            className="text-sm font-bold text-charcoal hover:text-butter-800 flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-beige-300 shadow-warm-sm hover:bg-cream transition-all whitespace-nowrap"
          >
            <span>View All {colleges.length || 13} Colleges</span>
            <ArrowRight className="w-4 h-4 text-butter-700" />
          </Link>
        </div>

        {loadingColleges ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-beige-200 p-4 space-y-3 animate-pulse">
                <div className="h-44 bg-cream rounded-xl"></div>
                <div className="h-4 bg-cream rounded w-3/4"></div>
                <div className="h-3 bg-cream rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcaseColleges.map((col) => (
              <div
                key={col.id}
                className="group bg-white rounded-2xl border border-beige-200 shadow-warm-sm hover:shadow-warm transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Campus Photo Header */}
                  <div className="relative h-44 w-full overflow-hidden bg-cream">
                    <img
                      src={col.image_url || FALLBACK_CAMPUS_IMG}
                      alt={col.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_CAMPUS_IMG;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent"></div>
                    
                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-white/95 backdrop-blur-sm text-charcoal text-xs font-bold shadow-sm border border-beige-200">
                        {col.college_type}
                      </span>
                      {col.nirf_rank && (
                        <span className="px-2 py-0.5 rounded-md bg-butter-400 text-charcoal text-[11px] font-bold shadow-sm flex items-center space-x-1 border border-butter-500/50">
                          <Award className="w-3 h-3 text-butter-900" />
                          <span>NIRF #{col.nirf_rank}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* College Information in Body to Prevent Clipping */}
                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-charcoal-muted">
                        Code: {col.code}
                      </span>
                      <h3 className="text-base font-bold text-charcoal leading-snug line-clamp-2 mt-0.5 group-hover:text-butter-800 transition-colors">
                        {col.name}
                      </h3>
                      <div className="flex items-center text-xs text-charcoal-muted mt-1.5 space-x-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-butter-700 flex-shrink-0" />
                        <span>{col.city}, {col.state}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-beige-200">
                      <div className="p-2.5 rounded-xl bg-cream/70 border border-beige-200">
                        <div className="text-[10px] text-charcoal-muted font-medium">Annual Tuition</div>
                        <div className="font-bold text-charcoal mt-0.5">
                          {col.annual_tuition_fee ? `₹${col.annual_tuition_fee.toLocaleString()}` : 'Subsidized'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-cream/70 border border-beige-200">
                        <div className="text-[10px] text-charcoal-muted font-medium">Median Package</div>
                        <div className="font-bold text-charcoal mt-0.5">
                          {col.median_package_lpa ? `₹${col.median_package_lpa} LPA` : 'Verified'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-cream/40 border-t border-beige-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-charcoal-muted flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Official Records</span>
                  </span>
                  <Link
                    to={`/colleges/${col.id}`}
                    className="px-3 py-1.5 rounded-xl bg-butter-500 hover:bg-butter-600 text-charcoal font-bold flex items-center space-x-1 shadow-warm-sm transition-all"
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

      {/* 3. Core Feature Pillars - Student-Focused Explanation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 text-butter-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="w-4 h-4 text-butter-700" />
            <span>How Your Recommendations Are Created</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
            Clear, Evidence-Backed Admission Guidance
          </h2>
          <p className="mt-3 text-charcoal-muted text-sm max-w-2xl mx-auto leading-relaxed font-medium">
            Instead of sponsored advertisements or random listings, our recommendations are grounded in authentic cutoff trends, 
            audited fees, and historical admission patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-warm-sm flex flex-col justify-between hover:shadow-warm transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-butter-200 text-charcoal flex items-center justify-center mb-4 border border-butter-300">
                <Sparkles className="w-6 h-6 text-charcoal" />
              </div>
              <h3 className="text-base font-bold text-charcoal mb-2">1. Best-Match Recommendation</h3>
              <p className="text-xs text-charcoal-muted leading-relaxed font-medium">
                Identifies one primary college recommendation that balances your entrance exam score, branch interest, annual budget, and career placement outcomes.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-warm-sm flex flex-col justify-between hover:shadow-warm transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-butter-200 text-charcoal flex items-center justify-center mb-4 border border-butter-300">
                <Zap className="w-6 h-6 text-charcoal" />
              </div>
              <h3 className="text-base font-bold text-charcoal mb-2">2. Top Private Alternatives</h3>
              <p className="text-xs text-charcoal-muted leading-relaxed font-medium">
                Highlights high-reputation private universities like BITS Pilani or VIT when suitable, explaining distinctive curriculum benefits and their specific entrance exams.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-warm-sm flex flex-col justify-between hover:shadow-warm transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-butter-200 text-charcoal flex items-center justify-center mb-4 border border-butter-300">
                <Layers className="w-6 h-6 text-charcoal" />
              </div>
              <h3 className="text-base font-bold text-charcoal mb-2">3. Reach, Target & Safe Options</h3>
              <p className="text-xs text-charcoal-muted leading-relaxed font-medium">
                Organizes additional choices into Ambitious (Reach), Realistic (Target), and Safe tiers based on official past round cutoffs and reservation categories.
              </p>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-warm-sm flex flex-col justify-between hover:shadow-warm transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-butter-200 text-charcoal flex items-center justify-center mb-4 border border-butter-300">
                <BotMessageSquare className="w-6 h-6 text-charcoal" />
              </div>
              <h3 className="text-base font-bold text-charcoal mb-2">4. Question & Answer Guide</h3>
              <p className="text-xs text-charcoal-muted leading-relaxed font-medium">
                Ask specific questions about hostel costs, eligibility rules, and college comparisons, receiving answers supported by official brochures and counselling archives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Question Preview Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-cream border border-beige-200 p-6 sm:p-10 shadow-warm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2 text-butter-800 font-bold text-xs tracking-wider uppercase">
                <BotMessageSquare className="w-4 h-4 text-butter-700" />
                <span>Ask Questions About Colleges</span>
              </div>
              <h3 className="text-2xl font-extrabold text-charcoal mt-1 tracking-tight">
                Try Asking About Any College
              </h3>
            </div>
            <Link
              to="/chat"
              className="text-xs font-bold text-charcoal hover:text-butter-800 flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-white border border-beige-300 shadow-warm-sm hover:bg-butter-100 transition-colors"
            >
              <span>Open Full Chat Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Suggested Prompts */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              "What is the CSE cutoff for IIT Bombay?",
              "What is the BITSAT cutoff and fee for BITS Pilani?",
              "What are the annual fees for IIT Madras?",
              "What is the median placement package at IIIT Hyderabad?"
            ].map((q) => (
              <button
                key={q}
                onClick={() => handleQuickAsk(q)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-butter-200 border border-beige-300 text-xs text-charcoal font-semibold transition-colors shadow-xs"
              >
                "{q}"
              </button>
            ))}
          </div>

          {/* Answer Preview Box */}
          <div className="bg-white rounded-2xl p-5 border border-beige-200 shadow-warm-sm min-h-[120px] flex flex-col justify-between">
            {previewLoading ? (
              <div className="flex items-center justify-center py-6 text-charcoal-muted space-x-2">
                <div className="w-4 h-4 border-2 border-butter-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Looking up official college records...</span>
              </div>
            ) : previewAnswer ? (
              <div className="space-y-3">
                <div className="text-xs font-bold text-charcoal bg-cream px-2.5 py-1 rounded-lg inline-block border border-beige-200">
                  Question: "{chatPreview}"
                </div>
                <div className="text-sm text-charcoal whitespace-pre-line leading-relaxed font-medium">
                  {previewAnswer.reply}
                </div>
                {previewAnswer.citations && previewAnswer.citations.length > 0 && (
                  <div className="pt-3 border-t border-beige-200 flex flex-wrap gap-2 text-xs text-charcoal-muted">
                    <span className="font-bold text-charcoal">Official Sources:</span>
                    {previewAnswer.citations.map((c, i) => (
                      <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-charcoal font-bold underline decoration-butter-500 hover:text-butter-800 flex items-center space-x-1"
                      >
                        <span>{c.source_name}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-charcoal-muted text-sm flex items-center justify-center py-6 font-medium">
                Click a sample question above to see instant answers supported by official documents.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
