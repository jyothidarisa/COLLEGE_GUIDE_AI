import React from 'react';
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
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function RecommendationsPage() {
  const { recommendations, studentProfile, compareList, addToCompare } = useApp();

  if (!recommendations) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4 border border-sky-100">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Active Recommendation Assessment</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
          Submit your entrance exam rank and preferences to generate an evidence-backed list of suitable engineering colleges.
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

  const renderCollegeCard = (college, tierStyle) => {
    const isCompared = compareList.some((c) => c.id === college.college_id);

    return (
      <div
        key={college.college_id}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
      >
        <div className="p-5 sm:p-6 space-y-4">
          {/* Card Top: Name, Badges, NIRF */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${tierStyle.badge}`}>
                  {college.admission_suitability}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                  {college.college_type}
                </span>
                {college.nirf_rank && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 flex items-center space-x-1">
                    <Award className="w-3 h-3 text-amber-600" />
                    <span>NIRF #{college.nirf_rank}</span>
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {college.name}
              </h3>
              <div className="flex items-center text-xs text-slate-500 mt-1 space-x-2">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{college.city}, {college.state}</span>
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-700">{college.code}</span>
              </div>
            </div>

            {/* Match Score */}
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-black text-slate-900 leading-none">
                {college.match_score}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Match Index
              </span>
            </div>
          </div>

          {/* Program & Cutoff Insight */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
            <div className="font-semibold text-slate-900 flex justify-between items-center">
              <span>Matched Course:</span>
              <span className="text-sky-700 font-bold">{college.course_name} ({college.matched_course})</span>
            </div>
            {college.historical_cutoff ? (
              <div className="flex justify-between items-center text-slate-600">
                <span>{college.historical_cutoff.year} Closing Cutoff:</span>
                <span className="font-bold text-slate-900">
                  {college.historical_cutoff.closing_value} ({college.historical_cutoff.type})
                </span>
              </div>
            ) : (
              <div className="text-slate-400 italic">Historical cutoff record pending verification</div>
            )}
            <div className="text-slate-600 leading-relaxed pt-1 border-t border-slate-200/60">
              <span className="font-semibold text-slate-700">Suitability Reason: </span>
              {college.suitability_explanation}
            </div>
          </div>

          {/* Key Metrics: Fees & Placements */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-2.5 rounded-lg border border-slate-100 bg-white">
              <div className="text-slate-400 text-[11px] font-medium">Annual Tuition Fee</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {college.annual_tuition_fee ? `₹${college.annual_tuition_fee.toLocaleString()}` : 'Pending Verification'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Hostel: {college.hostel_available ? (college.hostel_fee_annual ? `₹${college.hostel_fee_annual.toLocaleString()}/yr` : 'Available') : 'Not on-campus'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-100 bg-white">
              <div className="text-slate-400 text-[11px] font-medium">Placement CTC (Median)</div>
              <div className="font-bold text-emerald-600 text-sm mt-0.5">
                {college.placement_statistics?.median_package_lpa ? `₹${college.placement_statistics.median_package_lpa} LPA` : 'Not documented'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Highest: {college.placement_statistics?.highest_package_lpa ? `₹${college.placement_statistics.highest_package_lpa} LPA` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="space-y-1.5 text-xs">
            {college.pros && college.pros.length > 0 && (
              <div className="space-y-1">
                {college.pros.slice(0, 2).map((pro, idx) => (
                  <div key={idx} className="flex items-start space-x-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-600" />
                    <span>{pro}</span>
                  </div>
                ))}
              </div>
            )}
            {college.cons && college.cons.length > 0 && (
              <div className="space-y-1">
                {college.cons.slice(0, 1).map((con, idx) => (
                  <div key={idx} className="flex items-start space-x-1.5 text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                    <span>{con}</span>
                  </div>
                ))}
              </div>
            )}
            {college.missing_information && college.missing_information.length > 0 && (
              <div className="space-y-1">
                {college.missing_information.slice(0, 1).map((msg, idx) => (
                  <div key={idx} className="flex items-start space-x-1.5 text-slate-500 italic">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card Footer: Sources & Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center space-x-2">
            <span>Verified: {college.data_freshness_year}</span>
            {college.sources && college.sources.length > 0 && (
              <a
                href={college.sources[0].url}
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 hover:underline flex items-center space-x-0.5"
                title={college.sources[0].source_name}
              >
                <span>Official Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => addToCompare({ id: college.college_id, name: college.name, code: college.code })}
              disabled={isCompared}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 transition-colors ${
                isCompared
                  ? 'bg-emerald-100 text-emerald-800 cursor-default'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isCompared ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Compare</span>
                </>
              )}
            </button>
            <Link
              to={`/colleges/${college.college_id}`}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center space-x-1 transition-colors shadow-sm"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner with Profile Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Admission Recommendations</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Recommended Colleges for {studentProfile?.preferred_course}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Exam: <strong className="text-slate-800">{studentProfile?.entrance_exam}</strong> • Score/Rank: <strong className="text-slate-800">{studentProfile?.rank_or_score}</strong> • Category: <strong className="text-slate-800">{studentProfile?.category}</strong> • Max Budget: <strong className="text-slate-800">{studentProfile?.max_tuition_budget ? `₹${studentProfile.max_tuition_budget.toLocaleString()}` : 'Any'}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/profile"
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjust Filters</span>
          </Link>
          <Link
            to="/compare"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <span>Compare Selected ({compareList.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Empty State / Suggestions */}
      {recommendations.total_found === 0 && (
        <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="text-lg font-bold text-amber-900">No Colleges Passed Hard Eligibility & Constraints</h3>
          <p className="text-sm text-amber-800 max-w-xl mx-auto leading-relaxed">
            {recommendations.message}
          </p>
          {recommendations.relaxations_suggested && (
            <div className="max-w-md mx-auto text-left bg-white/80 p-4 rounded-xl border border-amber-200 text-xs space-y-1.5">
              <div className="font-bold text-amber-900">Suggested Relaxations:</div>
              {recommendations.relaxations_suggested.map((sug, i) => (
                <div key={i} className="flex items-start space-x-1.5 text-amber-800">
                  <span className="font-bold">•</span>
                  <span>{sug}</span>
                </div>
              ))}
            </div>
          )}
          <Link
            to="/profile"
            className="inline-flex items-center px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs transition-colors"
          >
            Modify Budget or Examination
          </Link>
        </div>
      )}

      {/* Tier 1: Better-Matched Options */}
      {recommendations.better_matched.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <h2 className="text-lg font-bold text-slate-900">
              Better-Matched Options ({recommendations.better_matched.length})
            </h2>
            <span className="text-xs text-slate-500">
              — Your rank/cutoff closely aligns with past closing cutoffs.
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.better_matched.map((col) =>
              renderCollegeCard(col, {
                badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
              })
            )}
          </div>
        </section>
      )}

      {/* Tier 2: Ambitious Options */}
      {recommendations.ambitious.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
            <h2 className="text-lg font-bold text-slate-900">
              Ambitious Options ({recommendations.ambitious.length})
            </h2>
            <span className="text-xs text-slate-500">
              — Highly competitive colleges with cutoffs slightly above past records.
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.ambitious.map((col) =>
              renderCollegeCard(col, {
                badge: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
              })
            )}
          </div>
        </section>
      )}

      {/* Tier 3: Alternative Options */}
      {recommendations.alternative.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <span className="w-3 h-3 rounded-full bg-sky-500"></span>
            <h2 className="text-lg font-bold text-slate-900">
              Alternative / Safe Options ({recommendations.alternative.length})
            </h2>
            <span className="text-xs text-slate-500">
              — Solid admission probability where your qualifications comfortably clear past cutoffs.
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.alternative.map((col) =>
              renderCollegeCard(col, {
                badge: 'bg-sky-50 text-sky-800 border border-sky-200',
              })
            )}
          </div>
        </section>
      )}

      {/* Tier 4: Insufficient Data */}
      {recommendations.insufficient_data.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <span className="w-3 h-3 rounded-full bg-slate-400"></span>
            <h2 className="text-lg font-bold text-slate-900">
              Insufficient Data to Estimate Suitability ({recommendations.insufficient_data.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.insufficient_data.map((col) =>
              renderCollegeCard(col, {
                badge: 'bg-slate-100 text-slate-700 border border-slate-300',
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
}
