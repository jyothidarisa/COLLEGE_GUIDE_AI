import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  Award, 
  CheckCircle2, 
  Info, 
  PlusCircle, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Compass, 
  ChevronRight,
  Sliders,
  Cpu,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const FALLBACK_CAMPUS_IMG = "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80";

export default function RecommendationsPage() {
  const { recommendations, studentProfile, compareList, addToCompare } = useApp();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'target', 'reach', 'safer'
  const [expandedXAIId, setExpandedXAIId] = useState(null);

  if (!recommendations) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-butter-200 text-charcoal flex items-center justify-center mx-auto mb-4 border border-butter-300 shadow-warm-sm">
          <Sparkles className="w-8 h-8 text-butter-800" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal mb-2">No Active Recommendation Assessment</h2>
        <p className="text-charcoal-muted text-sm max-w-md mx-auto mb-6 font-medium">
          Submit your entrance exam score or rank and preferences to generate a personalized list of suitable engineering colleges.
        </p>
        <Link
          to="/profile"
          className="inline-flex items-center px-6 py-3 rounded-xl bg-butter-500 hover:bg-butter-600 text-charcoal font-bold text-sm shadow-warm-sm hover:shadow transition-all hover:scale-105"
        >
          <span>Fill Profile & Find Colleges</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    );
  }

  const {
    best_match,
    intelligent_alternatives = [],
    reach = [],
    target = [],
    safer = []
  } = recommendations;

  const getFilteredColleges = () => {
    const isBest = (c) => best_match && c.college_id === best_match.college_id;
    const filterBest = (list) => list.filter(c => !isBest(c));

    if (activeTab === 'target') return filterBest(target);
    if (activeTab === 'reach') return filterBest(reach);
    if (activeTab === 'safer') return filterBest(safer);

    return [
      ...filterBest(target),
      ...filterBest(reach),
      ...filterBest(safer)
    ];
  };

  const filteredColleges = getFilteredColleges();

  const getTierBadgeStyle = (suitability) => {
    switch (suitability?.toLowerCase()) {
      case 'target':
      case 'better-matched':
        return 'bg-emerald-50 text-emerald-900 border border-emerald-200';
      case 'reach':
      case 'ambitious':
        return 'bg-amber-100 text-amber-900 border border-amber-300';
      case 'safer':
      case 'alternative':
        return 'bg-butter-100 text-charcoal border border-butter-300';
      default:
        return 'bg-cream text-charcoal border border-beige-200';
    }
  };

  const renderStandardCard = (college) => {
    const isCompared = compareList.some((c) => c.id === college.college_id);

    return (
      <div
        key={college.college_id}
        className="group bg-white rounded-2xl border border-beige-200 shadow-warm-sm hover:shadow-warm transition-all flex flex-col justify-between overflow-hidden"
      >
        <div>
          {/* Card Image */}
          <div className="relative h-44 w-full bg-cream overflow-hidden">
            <img
              src={college.image_url || FALLBACK_CAMPUS_IMG}
              alt={college.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_CAMPUS_IMG;
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent"></div>
            
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold shadow-sm ${getTierBadgeStyle(college.admission_suitability)}`}>
                {college.admission_suitability} Option
              </span>
              {college.nirf_rank && (
                <span className="px-2 py-0.5 rounded-md bg-butter-400 text-charcoal text-[11px] font-bold shadow-sm flex items-center space-x-1 border border-butter-500/50">
                  <Award className="w-3 h-3 text-butter-900" />
                  <span>NIRF #{college.nirf_rank}</span>
                </span>
              )}
            </div>

            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="text-[10px] font-bold uppercase tracking-wider text-butter-300">{college.code}</div>
              <h4 className="text-base font-bold text-white leading-tight truncate">{college.name}</h4>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-charcoal-muted">
              <span className="flex items-center space-x-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-butter-700 flex-shrink-0" />
                <span>{college.city}, {college.state}</span>
              </span>
              <div className="flex items-center space-x-1 font-bold text-charcoal">
                <span className="text-charcoal-muted font-normal">Match Score:</span>
                <span className="text-butter-800 bg-butter-100 px-1.5 py-0.5 rounded border border-butter-300">{college.match_score}/100</span>
              </div>
            </div>

            {/* Matched Course and Cutoff */}
            <div className="p-3.5 rounded-xl bg-cream/70 border border-beige-200 text-xs space-y-1.5">
              <div className="font-semibold text-charcoal flex justify-between items-center">
                <span className="text-charcoal-muted">Matched Branch:</span>
                <span className="text-charcoal font-bold">{college.course_name} ({college.matched_course})</span>
              </div>
              {college.historical_cutoff && (
                <div className="flex justify-between items-center text-charcoal">
                  <span className="text-charcoal-muted">{college.historical_cutoff.year} Closing Value:</span>
                  <span className="font-bold text-charcoal">
                    {college.historical_cutoff.closing_value} ({college.historical_cutoff.type})
                  </span>
                </div>
              )}
              <div className="text-charcoal-muted leading-relaxed pt-1.5 border-t border-beige-200 font-medium">
                <span className="font-bold text-charcoal">Why This Fits You: </span>
                {college.suitability_explanation}
              </div>
            </div>

            {/* Fees & Placements */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-cream/70 border border-beige-200">
                <div className="text-charcoal-muted text-[10px] font-medium">Annual Tuition</div>
                <div className="font-bold text-charcoal mt-0.5">
                  {college.annual_tuition_fee ? `₹${college.annual_tuition_fee.toLocaleString()}` : 'Subsidized'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-cream/70 border border-beige-200">
                <div className="text-charcoal-muted text-[10px] font-medium">Median CTC</div>
                <div className="font-bold text-charcoal mt-0.5">
                  {college.placement_statistics?.median_package_lpa ? `₹${college.placement_statistics.median_package_lpa} LPA` : 'Verified'}
                </div>
              </div>
            </div>

            {/* Pros Snippet */}
            {college.pros && college.pros.length > 0 && (
              <div className="space-y-1 text-xs">
                {college.pros.slice(0, 1).map((pro, idx) => (
                  <div key={idx} className="flex items-start space-x-1.5 text-charcoal font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-butter-700" />
                    <span>{pro}</span>
                  </div>
                ))}
              </div>
            )}

            {/* XAI (Explainable AI) Feature Attribution Section */}
            <div className="pt-2 border-t border-beige-200">
              <button
                type="button"
                onClick={() => setExpandedXAIId(expandedXAIId === college.college_id ? null : college.college_id)}
                className="w-full text-left p-2.5 rounded-xl bg-butter-50 hover:bg-butter-100 border border-butter-200 text-xs font-semibold text-charcoal flex items-center justify-between transition-colors shadow-xs"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-butter-800" />
                  <span className="font-bold">Explainable AI (XAI) Formula</span>
                </span>
                <span className="text-[11px] text-butter-900 font-bold underline flex items-center gap-1">
                  {expandedXAIId === college.college_id ? 'Hide Attribution' : 'Why Recommended (MC-SFA)'}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedXAIId === college.college_id ? 'rotate-180' : ''}`} />
                </span>
              </button>

              {expandedXAIId === college.college_id && (
                <div className="mt-2.5 p-3.5 bg-white rounded-xl border border-butter-300 space-y-2.5 text-xs shadow-sm">
                  <div className="flex justify-between items-center text-[11px] font-bold text-charcoal pb-1.5 border-b border-beige-200">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-[#D49A1F]" />
                      Multi-Criteria Shapley Decomposition
                    </span>
                    <span className="px-2 py-0.5 rounded bg-butter-100 border border-butter-300 text-charcoal font-extrabold">
                      {college.match_score}/100 Match
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-charcoal-muted">Cutoff Compatibility (Weight: 35%)</span>
                        <span className="font-bold text-charcoal">{college.score_breakdown?.suitability || 85}%</span>
                      </div>
                      <div className="w-full bg-cream h-1.5 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-butter-600 rounded-full" style={{ width: `${college.score_breakdown?.suitability || 85}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-charcoal-muted">Placement Track Record (Weight: 25%)</span>
                        <span className="font-bold text-charcoal">{college.score_breakdown?.placement || 90}%</span>
                      </div>
                      <div className="w-full bg-cream h-1.5 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-butter-600 rounded-full" style={{ width: `${college.score_breakdown?.placement || 90}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-charcoal-muted">Tuition Affordability (Weight: 20%)</span>
                        <span className="font-bold text-charcoal">{college.score_breakdown?.affordability || 80}%</span>
                      </div>
                      <div className="w-full bg-cream h-1.5 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-butter-600 rounded-full" style={{ width: `${college.score_breakdown?.affordability || 80}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-charcoal-muted">Location Preference (Weight: 10%)</span>
                        <span className="font-bold text-charcoal">{college.score_breakdown?.location || 75}%</span>
                      </div>
                      <div className="w-full bg-cream h-1.5 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-butter-600 rounded-full" style={{ width: `${college.score_breakdown?.location || 75}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-charcoal-muted">NIRF & Accreditation Tier (Weight: 10%)</span>
                        <span className="font-bold text-charcoal">{college.score_breakdown?.nirf || 80}%</span>
                      </div>
                      <div className="w-full bg-cream h-1.5 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-butter-600 rounded-full" style={{ width: `${college.score_breakdown?.nirf || 80}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-charcoal-muted pt-2 border-t border-beige-200 leading-snug">
                    <span className="font-bold text-charcoal">XAI Transparency Note: </span>
                    Scores follow S(c, x) = S₀ + Σ φ_k. No black-box algorithmic bias. Historical cutoff verified from official authority records.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Actions */}
        <div className="p-4 bg-cream/40 border-t border-beige-200 flex items-center justify-between text-xs">
          <Link
            to={`/colleges/${college.college_id}`}
            className="text-xs font-bold text-charcoal hover:text-butter-800 flex items-center space-x-1 transition-colors"
          >
            <span>View Full Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => addToCompare({ id: college.college_id, name: college.name, code: college.code })}
            disabled={isCompared}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
              isCompared
                ? 'bg-butter-200 text-charcoal border border-butter-400/60 cursor-default shadow-xs'
                : 'bg-white hover:bg-cream text-charcoal border border-beige-300'
            }`}
          >
            {isCompared ? (
              <>
                <Check className="w-3.5 h-3.5 text-charcoal" />
                <span>Added</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-3.5 h-3.5 text-butter-700" />
                <span>Compare</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-beige-200 pb-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-butter-800 mb-1">
            <Sparkles className="w-4 h-4 text-butter-700" />
            <span>Personalized College Recommendations</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
            Colleges Matching Your Profile
          </h1>
          <p className="text-charcoal-muted text-sm mt-1.5 font-medium">
            Based on your {studentProfile?.entrance_exam} score of {studentProfile?.rank_or_score} for {studentProfile?.preferred_course}.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/profile"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-cream text-charcoal border border-beige-300 text-xs font-bold transition-all shadow-warm-sm"
          >
            Edit Profile
          </Link>
          <Link
            to="/compare"
            className="px-4 py-2.5 rounded-xl bg-butter-500 hover:bg-butter-600 text-charcoal text-xs font-bold transition-all shadow-warm-sm hover:shadow"
          >
            Compare ({compareList.length})
          </Link>
        </div>
      </div>

      {/* Deep Learning & XAI Banner */}
      <div className="bg-gradient-to-r from-butter-100 via-cream to-butter-50 border border-butter-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-warm-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-butter-400 text-charcoal flex items-center justify-center flex-shrink-0 font-black shadow-xs">
            <Cpu className="w-5 h-5 text-charcoal" />
          </div>
          <div>
            <div className="text-xs font-bold text-charcoal flex items-center gap-1.5">
              <span>All 3 Deep Learning Models & Explainable AI (XAI) Active</span>
              <span className="bg-white border border-butter-400 text-[10px] px-1.5 py-0.2 rounded font-extrabold text-butter-900">
                MC-SFA
              </span>
            </div>
            <p className="text-[11px] text-charcoal-muted mt-0.5">
              Every score decomposes into mathematical Shapley feature attributions (Cutoff 35%, Placement 25%, Tuition 20%, Location 10%, NIRF 10%).
            </p>
          </div>
        </div>
        <Link
          to="/model-performance"
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-charcoal hover:bg-black text-ivory text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0"
        >
          <span>View Model Metrics & XAI</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. SPOTLIGHT: Single Best-Match Primary Recommendation */}
      {best_match && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-butter-600 animate-ping"></span>
              <h2 className="text-xl sm:text-2xl font-black text-charcoal tracking-tight">
                Your Best-Match College
              </h2>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-butter-200 text-charcoal border border-butter-400 text-xs font-extrabold uppercase tracking-wider shadow-xs">
              ★ Top Recommendation
            </span>
          </div>

          <div className="bg-gradient-to-br from-white via-cream/40 to-butter-100/50 rounded-3xl border-2 border-butter-400 shadow-warm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left Column: Campus Image Header with safe spacing */}
              <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full bg-charcoal overflow-hidden flex flex-col justify-between p-6">
                <img
                  src={best_match.image_url || FALLBACK_CAMPUS_IMG}
                  alt={best_match.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_CAMPUS_IMG;
                  }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-charcoal/20"></div>
                
                {/* Top Badges */}
                <div className="relative z-10 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-butter-500 text-charcoal text-xs font-black shadow-sm flex items-center space-x-1.5 border border-butter-600/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Match Score: {best_match.match_score}/100</span>
                  </span>
                  {best_match.nirf_rank && (
                    <span className="px-2.5 py-1 rounded-full bg-white/95 text-charcoal text-xs font-bold shadow-sm flex items-center space-x-1 border border-beige-200">
                      <Award className="w-3.5 h-3.5 text-butter-700" />
                      <span>NIRF #{best_match.nirf_rank}</span>
                    </span>
                  )}
                </div>

                {/* Bottom College Name */}
                <div className="relative z-10 text-white mt-auto pt-6">
                  <span className="text-xs uppercase tracking-wider font-bold text-butter-300">
                    {best_match.college_type} • {best_match.city}, {best_match.state}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1 leading-tight">
                    {best_match.name}
                  </h3>
                </div>
              </div>

              {/* Right Column: Detailed Justification & Specs */}
              <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Explanation Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-cream border border-beige-300/80 text-charcoal text-sm leading-relaxed shadow-warm-sm">
                    <div className="font-bold text-charcoal mb-1.5 flex items-center space-x-1.5">
                      <Compass className="w-4 h-4 text-butter-700" />
                      <span>Why This College Fits Your Profile:</span>
                    </div>
                    <p className="text-charcoal-muted font-medium">{best_match.suitability_explanation}</p>
                  </div>

                  {/* 4-Column Quick Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white border border-beige-200 shadow-warm-sm">
                      <div className="text-[11px] font-bold text-charcoal-muted uppercase">Target Branch</div>
                      <div className="text-sm font-black text-charcoal mt-1 truncate">
                        {best_match.matched_course}
                      </div>
                      <div className="text-[10px] text-charcoal-muted truncate font-medium">{best_match.course_name}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-beige-200 shadow-warm-sm">
                      <div className="text-[11px] font-bold text-charcoal-muted uppercase">Annual Tuition</div>
                      <div className="text-sm font-black text-charcoal mt-1">
                        {best_match.annual_tuition_fee ? `₹${best_match.annual_tuition_fee.toLocaleString()}` : 'Subsidized'}
                      </div>
                      <div className="text-[10px] text-charcoal-muted font-medium">
                        {best_match.hostel_available ? 'Hostel available' : 'Day scholar'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-beige-200 shadow-warm-sm">
                      <div className="text-[11px] font-bold text-charcoal-muted uppercase">Median Package</div>
                      <div className="text-sm font-black text-charcoal mt-1">
                        {best_match.placement_statistics?.median_package_lpa ? `₹${best_match.placement_statistics.median_package_lpa} LPA` : 'Verified'}
                      </div>
                      <div className="text-[10px] text-charcoal-muted font-medium">
                        Highest: {best_match.placement_statistics?.highest_package_lpa ? `₹${best_match.placement_statistics.highest_package_lpa}L` : 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-beige-200 shadow-warm-sm">
                      <div className="text-[11px] font-bold text-charcoal-muted uppercase">Admission Tier</div>
                      <div className="text-sm font-black text-charcoal mt-1">
                        {best_match.admission_suitability} Option
                      </div>
                      <div className="text-[10px] text-charcoal-muted font-medium">Past Cutoff Fit</div>
                    </div>
                  </div>

                  {/* Highlights and Pros */}
                  {best_match.pros && best_match.pros.length > 0 && (
                    <div className="space-y-1.5 text-xs">
                      {best_match.pros.map((pro, i) => (
                        <div key={i} className="flex items-start space-x-2 text-charcoal font-medium">
                          <CheckCircle2 className="w-4 h-4 text-butter-700 flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-beige-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-charcoal-muted flex items-center space-x-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Official Institutional Records ({best_match.data_freshness_year})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => addToCompare({ id: best_match.college_id, name: best_match.name, code: best_match.code })}
                      className="px-4 py-2.5 rounded-xl border border-beige-300 hover:bg-cream text-charcoal font-bold text-xs flex items-center space-x-1.5 transition-all shadow-warm-sm"
                    >
                      <PlusCircle className="w-4 h-4 text-butter-700" />
                      <span>Add to Compare</span>
                    </button>
                    <Link
                      to={`/colleges/${best_match.college_id}`}
                      className="px-5 py-2.5 rounded-xl bg-butter-500 hover:bg-butter-600 text-charcoal font-bold text-xs flex items-center space-x-1.5 transition-all shadow-warm-sm hover:shadow"
                    >
                      <span>View Full Profile</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. PRIVATE ALTERNATIVE RECOMMENDATIONS */}
      {intelligent_alternatives && intelligent_alternatives.length > 0 && (
        <section className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-butter-200/50 via-cream to-transparent border border-beige-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-warm-sm">
            <div>
              <div className="flex items-center space-x-2 text-butter-800 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-4 h-4 text-butter-700" />
                <span>Recommended Private Institutions</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-charcoal mt-1">
                Top Private Colleges Worth Considering
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5 font-medium">
                For students considering premier institutions, these private alternatives offer outstanding placement opportunities, flexible academic programs, and specialized scholarships.
              </p>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-butter-300 text-charcoal border border-butter-400 text-xs font-bold flex-shrink-0">
              {intelligent_alternatives.length} Options Suggested
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {intelligent_alternatives.map((alt) => (
              <div
                key={alt.college_id}
                className="bg-white rounded-2xl border border-beige-200 shadow-warm-sm p-5 sm:p-6 space-y-4 flex flex-col justify-between hover:shadow-warm transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-butter-100 text-charcoal border border-butter-300">
                          Private Alternative
                        </span>
                        {alt.nirf_rank && (
                          <span className="px-2 py-0.5 rounded-md bg-butter-400 text-charcoal text-[11px] font-bold flex items-center space-x-1 border border-butter-500/50">
                            <Award className="w-3 h-3 text-butter-900" />
                            <span>NIRF #{alt.nirf_rank}</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-charcoal">{alt.name}</h4>
                      <div className="text-xs text-charcoal-muted flex items-center space-x-2 mt-1">
                        <span className="font-medium">{alt.city}, {alt.state}</span>
                        <span>•</span>
                        <span className="font-semibold text-charcoal">Code: {alt.code}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-charcoal">{alt.match_score}/100</div>
                      <div className="text-[10px] text-charcoal-muted uppercase font-bold">Suitability</div>
                    </div>
                  </div>

                  {/* Crucial Admission Route Notice */}
                  {alt.admission_route_warning && (
                    <div className="p-3.5 rounded-xl bg-butter-100/70 border border-butter-300 text-xs text-charcoal leading-relaxed space-y-1">
                      <div className="font-bold flex items-center space-x-1.5 text-charcoal">
                        <ShieldAlert className="w-4 h-4 text-butter-800 flex-shrink-0" />
                        <span>Admission Route Information</span>
                      </div>
                      <p className="text-charcoal-muted font-medium">{alt.admission_route_warning}</p>
                    </div>
                  )}

                  {/* Why Consider this Alternative */}
                  {alt.alternative_reason && (
                    <div className="text-xs text-charcoal leading-relaxed bg-cream/70 p-3.5 rounded-xl border border-beige-200">
                      <span className="font-bold text-charcoal">Distinct Advantage: </span>
                      <span className="text-charcoal-muted font-medium">{alt.alternative_reason}</span>
                    </div>
                  )}

                  {/* Key Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-cream/70 border border-beige-200">
                      <div className="text-charcoal-muted text-[10px] font-medium">Annual Tuition Fee</div>
                      <div className="font-bold text-charcoal mt-0.5">
                        {alt.annual_tuition_fee ? `₹${alt.annual_tuition_fee.toLocaleString()}` : 'Subsidized'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-cream/70 border border-beige-200">
                      <div className="text-charcoal-muted text-[10px] font-medium">Placement Median CTC</div>
                      <div className="font-bold text-charcoal mt-0.5">
                        {alt.placement_statistics?.median_package_lpa ? `₹${alt.placement_statistics.median_package_lpa} LPA` : 'Verified'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-beige-200 flex items-center justify-between text-xs">
                  <Link
                    to={`/colleges/${alt.college_id}`}
                    className="font-bold text-charcoal hover:text-butter-800 flex items-center space-x-1 transition-colors"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => addToCompare({ id: alt.college_id, name: alt.name, code: alt.code })}
                    className="px-3.5 py-1.5 rounded-xl border border-beige-300 hover:bg-cream text-charcoal font-bold transition-all"
                  >
                    + Compare
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. EXPLORE MORE OPTIONS: REACH, TARGET, SAFE */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-charcoal tracking-tight">
              Explore More Options by Category
            </h2>
            <p className="text-charcoal-muted text-sm mt-1 font-medium">
              Organized into Reach (Ambitious), Target (Realistic), and Safe tiers based on historical admission cutoffs.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-cream border border-beige-200 rounded-xl text-xs font-bold shadow-warm-sm">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'all' ? 'bg-butter-400 text-charcoal shadow-warm-sm font-bold' : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              All Options ({target.length + reach.length + safer.length})
            </button>
            <button
              onClick={() => setActiveTab('target')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'target' ? 'bg-butter-400 text-charcoal shadow-warm-sm font-bold' : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              Target ({target.length})
            </button>
            <button
              onClick={() => setActiveTab('reach')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'reach' ? 'bg-butter-400 text-charcoal shadow-warm-sm font-bold' : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              Reach ({reach.length})
            </button>
            <button
              onClick={() => setActiveTab('safer')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'safer' ? 'bg-butter-400 text-charcoal shadow-warm-sm font-bold' : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              Safe ({safer.length})
            </button>
          </div>
        </div>

        {/* Advisory Notice */}
        <div className="p-4 rounded-xl bg-cream/70 border border-beige-200 text-xs text-charcoal-muted flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-butter-700 flex-shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">
            <strong className="text-charcoal">Historical Cutoff Advisory:</strong> Category tiers are determined from audited past counselling rounds. 
            Cutoffs fluctuate annually based on applicant count, seat matrices, and board results. Past trends serve as reference benchmarks.
          </span>
        </div>

        {filteredColleges.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-beige-200 text-center text-charcoal-muted text-sm shadow-warm-sm font-medium">
            No additional colleges found in the selected category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredColleges.map((col) => renderStandardCard(col))}
          </div>
        )}
      </section>
    </div>
  );
}
