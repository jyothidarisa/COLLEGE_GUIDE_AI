import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Building2, 
  MapPin, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ExternalLink, 
  PlusCircle, 
  Check, 
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Target,
  Compass,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const FALLBACK_CAMPUS_IMG = "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80";

export default function RecommendationsPage() {
  const { recommendations, studentProfile, compareList, addToCompare } = useApp();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'target', 'reach', 'safer'

  if (!recommendations) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4 border border-sky-100">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Active Recommendation Assessment</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
          Submit your entrance exam score or rank and preferences to generate an evidence-backed list of suitable engineering colleges.
        </p>
        <Link
          to="/profile"
          className="inline-flex items-center px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/30 transition-all hover:scale-105"
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

  // Filter explore more colleges
  const getFilteredColleges = () => {
    // Avoid duplicating the best_match in the secondary explore section
    const isBest = (c) => best_match && c.college_id === best_match.college_id;
    const filterBest = (list) => list.filter(c => !isBest(c));

    if (activeTab === 'target') return filterBest(target);
    if (activeTab === 'reach') return filterBest(reach);
    if (activeTab === 'safer') return filterBest(safer);

    // 'all' tab: Target first, then Reach, then Safer
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
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      case 'reach':
      case 'ambitious':
        return 'bg-purple-50 text-purple-800 border border-purple-200';
      case 'safer':
      case 'alternative':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  const renderStandardCard = (college) => {
    const isCompared = compareList.some((c) => c.id === college.college_id);

    return (
      <div
        key={college.college_id}
        className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
      >
        <div>
          {/* Card Image */}
          <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
            <img
              src={college.image_url || FALLBACK_CAMPUS_IMG}
              alt={college.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_CAMPUS_IMG;
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
            
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm ${getTierBadgeStyle(college.admission_suitability)}`}>
                {college.admission_suitability}
              </span>
              {college.nirf_rank && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[11px] font-bold shadow-sm flex items-center space-x-1">
                  <Award className="w-3 h-3" />
                  <span>NIRF #{college.nirf_rank}</span>
                </span>
              )}
            </div>

            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="text-[10px] font-semibold uppercase text-sky-200">{college.code}</div>
              <h4 className="text-base font-bold text-white leading-tight truncate">{college.name}</h4>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{college.city}, {college.state}</span>
              </span>
              <div className="flex items-center space-x-1 font-bold text-slate-900">
                <span className="text-slate-400 font-normal">Match:</span>
                <span>{college.match_score}/100</span>
              </div>
            </div>

            {/* Matched Course and Cutoff */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
              <div className="font-semibold text-slate-900 flex justify-between items-center">
                <span>Matched Course:</span>
                <span className="text-sky-700 font-bold">{college.course_name} ({college.matched_course})</span>
              </div>
              {college.historical_cutoff && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>{college.historical_cutoff.year} Cutoff:</span>
                  <span className="font-bold text-slate-900">
                    {college.historical_cutoff.closing_value} ({college.historical_cutoff.type})
                  </span>
                </div>
              )}
              <div className="text-slate-600 leading-relaxed pt-1 border-t border-slate-200/60">
                <span className="font-semibold text-slate-700">Admission Fit: </span>
                {college.suitability_explanation}
              </div>
            </div>

            {/* Fees & Placements */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-slate-400 text-[10px] font-medium">Annual Tuition</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {college.annual_tuition_fee ? `₹${college.annual_tuition_fee.toLocaleString()}` : 'Subsidized'}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-slate-400 text-[10px] font-medium">Median CTC</div>
                <div className="font-bold text-emerald-600 mt-0.5">
                  {college.placement_statistics?.median_package_lpa ? `₹${college.placement_statistics.median_package_lpa} LPA` : 'Verified'}
                </div>
              </div>
            </div>

            {/* Pros Snippet */}
            {college.pros && college.pros.length > 0 && (
              <div className="space-y-1 text-xs">
                {college.pros.slice(0, 1).map((pro, idx) => (
                  <div key={idx} className="flex items-start space-x-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-600" />
                    <span>{pro}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <Link
            to={`/colleges/${college.college_id}`}
            className="text-xs font-bold text-slate-700 hover:text-sky-600 flex items-center space-x-1"
          >
            <span>View Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => addToCompare({ id: college.college_id, name: college.name, code: college.code })}
            disabled={isCompared}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 transition-colors ${
              isCompared
                ? 'bg-emerald-100 text-emerald-800 cursor-default'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {isCompared ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Added</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-sky-700 mb-1">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>AI Admission Assessment</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Your College Recommendations
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Based on your {studentProfile?.entrance_exam} score of {studentProfile?.rank_or_score} for {studentProfile?.preferred_course}.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/profile"
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-all shadow-sm"
          >
            Refine Profile
          </Link>
          <Link
            to="/compare"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20"
          >
            Compare ({compareList.length})
          </Link>
        </div>
      </div>

      {/* 2. SPOTLIGHT: Single Best-Match Primary Recommendation */}
      {best_match && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Single Best-Match College
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider">
              ★ Top Recommendation
            </span>
          </div>

          <div className="bg-gradient-to-br from-white via-white to-sky-50/50 rounded-3xl border-2 border-sky-500 shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left Column: Campus Image */}
              <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full bg-slate-900 overflow-hidden">
                <img
                  src={best_match.image_url || FALLBACK_CAMPUS_IMG}
                  alt={best_match.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_CAMPUS_IMG;
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-sky-600 text-white text-xs font-black shadow-md flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Match Score: {best_match.match_score}/100</span>
                  </span>
                  {best_match.nirf_rank && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-md flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>NIRF #{best_match.nirf_rank}</span>
                    </span>
                  )}
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs uppercase tracking-wider font-semibold text-sky-300">
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
                  {/* Personalized Rationale */}
                  <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-100 text-slate-800 text-sm leading-relaxed">
                    <div className="font-bold text-sky-900 mb-1 flex items-center space-x-1.5">
                      <Compass className="w-4 h-4 text-sky-600" />
                      <span>Why This Is Your #1 Best Match:</span>
                    </div>
                    <p className="text-slate-700">{best_match.suitability_explanation}</p>
                  </div>

                  {/* 4-Column Quick Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Target Course</div>
                      <div className="text-sm font-black text-slate-900 mt-1 truncate">
                        {best_match.matched_course}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{best_match.course_name}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Annual Tuition</div>
                      <div className="text-sm font-black text-slate-900 mt-1">
                        {best_match.annual_tuition_fee ? `₹${best_match.annual_tuition_fee.toLocaleString()}` : 'Subsidized'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {best_match.hostel_available ? 'Hostel available' : 'Day scholar only'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Median Package</div>
                      <div className="text-sm font-black text-emerald-600 mt-1">
                        {best_match.placement_statistics?.median_package_lpa ? `₹${best_match.placement_statistics.median_package_lpa} LPA` : 'Verified'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Highest: {best_match.placement_statistics?.highest_package_lpa ? `₹${best_match.placement_statistics.highest_package_lpa}L` : 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Admission Tier</div>
                      <div className="text-sm font-black text-sky-700 mt-1">
                        {best_match.admission_suitability}
                      </div>
                      <div className="text-[10px] text-slate-500">Historical trend</div>
                    </div>
                  </div>

                  {/* Highlights and Pros */}
                  {best_match.pros && best_match.pros.length > 0 && (
                    <div className="space-y-1.5 text-xs">
                      {best_match.pros.map((pro, i) => (
                        <div key={i} className="flex items-start space-x-2 text-emerald-800 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Official • Data freshness {best_match.data_freshness_year}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => addToCompare({ id: best_match.college_id, name: best_match.name, code: best_match.code })}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add to Compare</span>
                    </button>
                    <Link
                      to={`/colleges/${best_match.college_id}`}
                      className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-sky-600/30"
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

      {/* 3. INTELLIGENT ALTERNATIVE RECOMMENDATIONS */}
      {intelligent_alternatives && intelligent_alternatives.length > 0 && (
        <section className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>Intelligent Private Alternatives</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                Top Private Institutions Worth Considering
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                For high-performing students aiming at premier institutions, these private alternatives offer outstanding placement ROI, 
                distinct curricular autonomy, or specialized scholarships.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold flex-shrink-0">
              {intelligent_alternatives.length} Alternatives Suggested
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {intelligent_alternatives.map((alt) => (
              <div
                key={alt.college_id}
                className="bg-white rounded-2xl border-2 border-amber-300 shadow-md p-5 sm:p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          Intelligent Alternative
                        </span>
                        {alt.nirf_rank && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[11px] font-bold flex items-center space-x-1">
                            <Award className="w-3 h-3" />
                            <span>NIRF #{alt.nirf_rank}</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">{alt.name}</h4>
                      <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span>{alt.city}, {alt.state}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{alt.code}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-amber-900">{alt.match_score}/100</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Suitability</div>
                    </div>
                  </div>

                  {/* Crucial Admission Route Warning */}
                  {alt.admission_route_warning && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
                      <div className="font-bold flex items-center space-x-1 text-amber-950">
                        <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
                        <span>Admission Pathway Notice</span>
                      </div>
                      <p>{alt.admission_route_warning}</p>
                    </div>
                  )}

                  {/* Why Consider this Alternative */}
                  {alt.alternative_reason && (
                    <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-900">Distinct Advantage: </span>
                      {alt.alternative_reason}
                    </div>
                  )}

                  {/* Key Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400 text-[10px]">Annual Tuition Fee</div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {alt.annual_tuition_fee ? `₹${alt.annual_tuition_fee.toLocaleString()}` : 'Subsidized'}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400 text-[10px]">Placement Median CTC</div>
                      <div className="font-bold text-emerald-600 mt-0.5">
                        {alt.placement_statistics?.median_package_lpa ? `₹${alt.placement_statistics.median_package_lpa} LPA` : 'Verified'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link
                    to={`/colleges/${alt.college_id}`}
                    className="font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1"
                  >
                    <span>Inspect Alternative</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => addToCompare({ id: alt.college_id, name: alt.name, code: alt.code })}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                  >
                    + Compare
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. EXPLORE MORE COLLEGES: REACH, TARGET, SAFER */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Explore More Colleges
            </h2>
            <p className="text-slate-600 text-sm mt-0.5">
              Organized into Reach, Target, and Safer tiers based on historical admission cutoffs.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Options ({target.length + reach.length + safer.length})
            </button>
            <button
              onClick={() => setActiveTab('target')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'target' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Target ({target.length})
            </button>
            <button
              onClick={() => setActiveTab('reach')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'reach' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reach ({reach.length})
            </button>
            <button
              onClick={() => setActiveTab('safer')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'safer' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Safer ({safer.length})
            </button>
          </div>
        </div>

        {/* Legal / Policy Disclaimer Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start space-x-2">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Historical Cutoff Advisory:</strong> Classifications are determined from audited past counselling rounds. 
            Cutoffs fluctuate annually based on applicant numbers, seat matrices, and board results. Past trends do not guarantee future admission.
          </span>
        </div>

        {filteredColleges.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
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
