import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Award, 
  ExternalLink, 
  ArrowLeft, 
  ShieldCheck, 
  PlusCircle, 
  Check
} from 'lucide-react';
import api from '../services/api';
import { useApp } from '../context/AppContext';

export default function CollegeDetailPage() {
  const { id } = useParams();
  const { compareList, addToCompare } = useApp();
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    setLoading(true);
    api.getCollege(id)
      .then((data) => {
        setCollege(data);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load college details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-butter-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-charcoal-muted font-medium text-sm">Loading college profile...</p>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-6 rounded-2xl bg-cream border border-beige-300 text-charcoal shadow-warm-sm">
          <h2 className="text-lg font-bold mb-2">College Record Not Found</h2>
          <p className="text-sm text-charcoal-muted mb-4 font-medium">{error || 'Unable to retrieve college profile.'}</p>
          <Link
            to="/colleges"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-butter-500 hover:bg-butter-600 text-charcoal text-xs font-bold shadow-warm-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to College Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const isCompared = compareList.some((c) => c.id === college.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/colleges"
          className="inline-flex items-center text-xs font-bold text-charcoal-muted hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 text-butter-700" />
          <span>Back to College Directory</span>
        </Link>
      </div>

      {/* College Header Hero with Natural Headings and Non-overlapping Badges */}
      <div className="bg-white rounded-2xl border border-beige-200 shadow-warm-sm overflow-hidden">
        {/* Campus Photo Banner with dynamic min-height */}
        <div className="relative min-h-[260px] sm:min-h-[300px] w-full bg-charcoal flex flex-col justify-end p-6 sm:p-8 overflow-hidden">
          <img
            src={college.image_url || "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80"}
            alt={college.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80";
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/45 to-charcoal/20"></div>
          
          <div className="relative z-10 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-charcoal shadow-sm border border-beige-200">
                {college.college_type}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-butter-300 text-charcoal border border-butter-400 shadow-sm flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-butter-800" />
                <span>{college.verification_status}</span>
              </span>
              {college.nirf_rank && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-butter-400 text-charcoal border border-butter-500/50 shadow-sm flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-butter-900" />
                  <span>NIRF Rank #{college.nirf_rank}</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              {college.name}
            </h1>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-muted font-medium">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-butter-700 flex-shrink-0" />
                  <span>{college.city}, {college.state}</span>
                </span>
                <span>•</span>
                <span>Code: <strong className="text-charcoal font-bold">{college.code}</strong></span>
                {college.established_year && (
                  <>
                    <span>•</span>
                    <span>Established: {college.established_year}</span>
                  </>
                )}
                {college.campus_area_acres && (
                  <>
                    <span>•</span>
                    <span>Campus: {college.campus_area_acres} Acres</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => addToCompare({ id: college.id, name: college.name, code: college.code })}
                disabled={isCompared}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all ${
                  isCompared
                    ? 'bg-butter-200 text-charcoal border border-butter-400 cursor-default shadow-xs'
                    : 'bg-white border border-beige-300 text-charcoal hover:bg-cream shadow-warm-sm'
                }`}
              >
                {isCompared ? (
                  <>
                    <Check className="w-4 h-4 text-charcoal" />
                    <span>Added to Compare</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-butter-700" />
                    <span>Add to Compare</span>
                  </>
                )}
              </button>

              <a
                href={college.official_website}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-butter-500 hover:bg-butter-600 text-charcoal font-bold text-xs flex items-center space-x-1.5 shadow-warm-sm transition-all"
              >
                <span>Official Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Overview Paragraph */}
          {college.overview && (
            <p className="text-sm text-charcoal-muted leading-relaxed border-t border-beige-200 pt-4 font-medium">
              {college.overview}
            </p>
          )}

          {/* Facilities badges */}
          {college.facilities && (
            <div className="pt-2">
              <div className="text-xs font-bold text-charcoal uppercase tracking-wider mb-2">Campus Facilities:</div>
              <div className="flex flex-wrap gap-2">
                {college.facilities.split(',').map((fac, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-cream border border-beige-200 text-charcoal text-xs font-semibold"
                  >
                    {fac.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-beige-200 space-x-1 overflow-x-auto pb-0.5 scrollbar-none">
        {[
          { key: 'courses', label: `Courses & Eligibility (${college.courses.length})` },
          { key: 'cutoffs', label: `Cutoff Trends (${college.cutoffs.length})` },
          { key: 'fees', label: 'Fees & Expenses' },
          { key: 'placements', label: 'Placements' },
          { key: 'scholarships', label: `Scholarships (${college.scholarships.length})` },
          { key: 'sources', label: `Information Sources (${college.sources.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap rounded-t-xl ${
              activeTab === tab.key
                ? 'border-butter-600 text-charcoal bg-butter-200/50 shadow-2xs'
                : 'border-transparent text-charcoal-muted hover:text-charcoal hover:bg-cream/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Courses & Eligibility */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {college.courses.map((course) => (
            <div
              key={course.id}
              className="p-5 rounded-2xl bg-white border border-beige-200 shadow-warm-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-butter-800 uppercase tracking-wider">
                      {course.degree} • {course.duration_years} Years
                    </span>
                    <h3 className="text-base font-bold text-charcoal mt-0.5 leading-snug">
                      {course.course_name}
                    </h3>
                    <span className="text-xs text-charcoal-muted">Code: {course.course_code}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-cream border border-beige-200 text-charcoal text-xs font-bold whitespace-nowrap">
                    Exam: {course.primary_exam}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-cream/70 border border-beige-200 text-xs space-y-1 mt-3">
                  <div className="font-bold text-charcoal">Eligibility Requirement:</div>
                  <div className="text-charcoal-muted leading-relaxed font-medium">
                    {course.eligibility_criteria || 'Passed 10+2 with PCM as per statutory council guidelines.'}
                  </div>
                  <div className="text-charcoal font-bold pt-1">
                    Min PCM Required: <span className="text-butter-800 font-extrabold">{course.minimum_pcm_percentage}%</span> in Class 12
                  </div>
                </div>
              </div>

              {course.total_seats && (
                <div className="text-xs text-charcoal-muted font-medium pt-2 border-t border-beige-200">
                  Total Approved Intake: <strong className="text-charcoal font-bold">{course.total_seats} seats</strong>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Historical Cutoffs */}
      {activeTab === 'cutoffs' && (
        <div className="bg-white rounded-2xl border border-beige-200 shadow-warm-sm overflow-hidden">
          <div className="p-4 bg-cream/60 border-b border-beige-200 text-xs text-charcoal-muted font-medium">
            Historical closing cutoff scores and ranks across official counselling rounds.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-cream text-charcoal uppercase font-bold text-[10px] tracking-wider border-b border-beige-200">
                <tr>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Exam Route</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quota</th>
                  <th className="py-3 px-4">Score / Rank Type</th>
                  <th className="py-3 px-4">Closing Value</th>
                  <th className="py-3 px-4">Round</th>
                  <th className="py-3 px-4">Archive Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-200">
                {college.cutoffs.map((cut, idx) => (
                  <tr key={idx} className="hover:bg-cream/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-charcoal">{cut.admission_year}</td>
                    <td className="py-3 px-4 font-semibold text-charcoal">{cut.exam_route}</td>
                    <td className="py-3 px-4 font-semibold text-charcoal">{cut.category}</td>
                    <td className="py-3 px-4 text-charcoal-muted">{cut.quota}</td>
                    <td className="py-3 px-4 text-charcoal-muted">{cut.score_or_rank_type}</td>
                    <td className="py-3 px-4 font-black text-charcoal text-sm">
                      {cut.closing_value}
                    </td>
                    <td className="py-3 px-4 text-charcoal-muted">Round {cut.round_number}</td>
                    <td className="py-3 px-4">
                      <a
                        href={cut.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-butter-800 hover:text-butter-900 font-bold flex items-center space-x-1"
                      >
                        <span>Official Archive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Fees & Expenses */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {college.fees.map((fee, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-beige-200 shadow-warm-sm space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center border-b border-beige-200 pb-2.5">
                    <span className="text-xs font-bold text-charcoal-muted">Academic Year</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-butter-200 text-charcoal border border-butter-300">
                      {fee.academic_year}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs mt-3">
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted">Annual Tuition Fee:</span>
                      <span className="font-extrabold text-charcoal text-sm">
                        ₹{fee.annual_tuition_fee.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted">Hostel Rent (Annual):</span>
                      <span className="font-bold text-charcoal">
                        {fee.hostel_fee_annual ? `₹${fee.hostel_fee_annual.toLocaleString()}` : 'Not Documented'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted">Mess / Boarding (Annual):</span>
                      <span className="font-bold text-charcoal">
                        {fee.mess_fee_annual ? `₹${fee.mess_fee_annual.toLocaleString()}` : 'Dividing system / N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2.5 border-t border-beige-200">
                      <span className="font-bold text-charcoal">Total Estimated Annual:</span>
                      <span className="font-black text-charcoal text-base">
                        ₹{fee.total_annual_estimate.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {fee.fee_breakdown_notes && (
                    <p className="text-[11px] text-charcoal-muted italic bg-cream/70 p-3 rounded-xl border border-beige-200 font-medium mt-3">
                      {fee.fee_breakdown_notes}
                    </p>
                  )}
                </div>

                <div className="pt-2 text-[11px] text-charcoal-muted flex justify-between items-center font-medium border-t border-beige-200">
                  <span>Verified: {fee.last_verified}</span>
                  <a
                    href={fee.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-butter-800 hover:text-butter-900 font-bold flex items-center space-x-0.5"
                  >
                    <span>Fee Schedule</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Placements */}
      {activeTab === 'placements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {college.placements.map((plc, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-beige-200 shadow-warm-sm space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center border-b border-beige-200 pb-2.5">
                    <span className="text-xs font-bold text-charcoal-muted">Reporting Batch</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-butter-200 text-charcoal border border-butter-300">
                      Graduating Batch {plc.reporting_year}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-2.5">
                    <div className="p-3 rounded-xl bg-cream/70 border border-beige-200">
                      <div className="text-[10px] uppercase font-bold text-charcoal-muted">Placement Rate</div>
                      <div className="text-lg font-black text-charcoal mt-0.5">
                        {plc.placement_percentage ? `${plc.placement_percentage}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-cream/70 border border-beige-200">
                      <div className="text-[10px] uppercase font-bold text-charcoal-muted">Median CTC</div>
                      <div className="text-lg font-black text-charcoal mt-0.5">
                        {plc.median_package_lpa ? `₹${plc.median_package_lpa} L` : 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-cream/70 border border-beige-200">
                      <div className="text-[10px] uppercase font-bold text-charcoal-muted">Highest CTC</div>
                      <div className="text-lg font-black text-charcoal mt-0.5">
                        {plc.highest_package_lpa ? `₹${plc.highest_package_lpa} L` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {plc.top_recruiters && (
                    <div className="text-xs space-y-1.5 mt-2">
                      <span className="font-bold text-charcoal">Prominent Recruiters:</span>
                      <p className="text-charcoal-muted leading-relaxed bg-cream/70 p-3 rounded-xl border border-beige-200 font-medium">
                        {plc.top_recruiters}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 text-[11px] text-charcoal-muted flex justify-between items-center font-medium border-t border-beige-200">
                  <span>Audited: {plc.verification_date}</span>
                  <a
                    href={plc.source_report_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-butter-800 hover:text-butter-900 font-bold flex items-center space-x-0.5"
                  >
                    <span>Audited Report</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Scholarships */}
      {activeTab === 'scholarships' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {college.scholarships.map((sch) => (
            <div
              key={sch.scholarship_name}
              className="p-5 rounded-2xl bg-white border border-beige-200 shadow-warm-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-sm font-bold text-charcoal">
                    {sch.scholarship_name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-cream text-charcoal border border-beige-200 whitespace-nowrap">
                    {sch.merit_or_need}
                  </span>
                </div>

                <div className="text-xs text-charcoal font-bold bg-butter-200/80 p-2.5 rounded-xl border border-butter-300 mt-2.5">
                  Award: {sch.award_amount_or_waiver}
                </div>

                <div className="text-xs text-charcoal-muted space-y-1 font-medium mt-2.5">
                  <span className="font-bold text-charcoal">Eligibility:</span>
                  <p>{sch.eligibility_criteria}</p>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-charcoal-muted flex justify-between items-center font-medium border-t border-beige-200">
                <span>Source: {sch.source_title}</span>
                {sch.application_url && (
                  <a
                    href={sch.application_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-butter-800 hover:text-butter-900 font-bold flex items-center space-x-0.5"
                  >
                    <span>Application Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 6: Sources & Verification */}
      {activeTab === 'sources' && (
        <div className="bg-white rounded-2xl border border-beige-200 shadow-warm-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-charcoal">
            Official Data Sources & Transparency
          </h3>
          <p className="text-xs text-charcoal-muted leading-relaxed font-medium">
            All cutoff records, tuition fee schedules, and placement statistics for {college.name} have been extracted from verified government bodies, counselling portals, and institutional audit reports.
          </p>
          <div className="space-y-3">
            {college.sources.map((src, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-cream/70 border border-beige-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-charcoal">{src.source_name}</div>
                  <div className="text-charcoal-muted font-medium">
                    Authority: {src.authority} • Academic Year: {src.year} {src.verified_date ? `• Verified: ${src.verified_date}` : ''}
                  </div>
                </div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-beige-300 text-charcoal hover:bg-cream font-bold flex items-center space-x-1 transition-all whitespace-nowrap"
                >
                  <span>Official Document</span>
                  <ExternalLink className="w-3 h-3 text-butter-700" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
