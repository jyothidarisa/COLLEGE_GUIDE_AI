import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Award, 
  GraduationCap, 
  CheckCircle2, 
  ExternalLink, 
  ArrowLeft, 
  ShieldCheck, 
  TrendingUp, 
  Layers, 
  PlusCircle, 
  Check, 
  Calendar, 
  DollarSign
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
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium text-sm">Loading verified college records...</p>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700">
          <h2 className="text-lg font-bold mb-2">College Record Not Found</h2>
          <p className="text-sm mb-4">{error || 'Unable to retrieve college profile.'}</p>
          <Link
            to="/colleges"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900"
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
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-sky-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Back to College Directory</span>
        </Link>
      </div>

      {/* College Header Hero */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Campus Photo Banner */}
        <div className="relative h-56 sm:h-72 w-full bg-slate-900 overflow-hidden">
          <img
            src={college.image_url || "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80"}
            alt={college.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80";
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-800 shadow-sm">
                {college.college_type}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{college.verification_status}</span>
              </span>
              {college.nirf_rank && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>NIRF Rank #{college.nirf_rank}</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {college.name}
            </h1>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{college.city}, {college.state}</span>
              </span>
              <span>•</span>
              <span>Code: <strong className="text-slate-800">{college.code}</strong></span>
              {college.established_year && (
                <>
                  <span>•</span>
                  <span>Est: {college.established_year}</span>
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
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => addToCompare({ id: college.id, name: college.name, code: college.code })}
              disabled={isCompared}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all ${
                isCompared
                  ? 'bg-emerald-100 text-emerald-800 cursor-default'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
            >
              {isCompared ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Compare</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Add to Compare</span>
                </>
              )}
            </button>

            <a
              href={college.official_website}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-sky-600/30 transition-all hover:scale-105"
            >
              <span>Official Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Overview Paragraph */}
        {college.overview && (
          <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
            {college.overview}
          </p>
        )}

        {/* Facilities badges */}
        {college.facilities && (
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Campus Facilities:</div>
            <div className="flex flex-wrap gap-2">
              {college.facilities.split(',').map((fac, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
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
      <div className="flex border-b border-slate-200 space-x-2">
        {[
          { key: 'courses', label: `Courses & Eligibility (${college.courses.length})` },
          { key: 'cutoffs', label: `Cutoff Trends (${college.cutoffs.length})` },
          { key: 'fees', label: 'Fees & Expenses' },
          { key: 'placements', label: 'Placements' },
          { key: 'scholarships', label: `Scholarships (${college.scholarships.length})` },
          { key: 'sources', label: `Sources & Verifications (${college.sources.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
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
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                    {course.degree} • {course.duration_years} Years
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {course.course_name}
                  </h3>
                  <span className="text-xs text-slate-400">Code: {course.course_code}</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                  Exam: {course.primary_exam}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="font-semibold text-slate-800">Eligibility Requirement:</div>
                <div className="text-slate-600 leading-relaxed">
                  {course.eligibility_criteria || 'Passed 10+2 with PCM as per statutory council guidelines.'}
                </div>
                <div className="text-emerald-700 font-semibold pt-1">
                  Min PCM Required: {course.minimum_pcm_percentage}% in Class 12
                </div>
              </div>

              {course.total_seats && (
                <div className="text-xs text-slate-500">
                  Total Approved Intake: <strong className="text-slate-800">{course.total_seats} seats</strong>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Historical Cutoffs */}
      {activeTab === 'cutoffs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
            Historical closing cutoff scores and ranks across official counselling rounds.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Exam Route</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quota</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Closing Value</th>
                  <th className="py-3 px-4">Round</th>
                  <th className="py-3 px-4">Source Archive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {college.cutoffs.map((cut, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{cut.admission_year}</td>
                    <td className="py-3 px-4 font-semibold text-sky-700">{cut.exam_route}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{cut.category}</td>
                    <td className="py-3 px-4 text-slate-600">{cut.quota}</td>
                    <td className="py-3 px-4 text-slate-500">{cut.score_or_rank_type}</td>
                    <td className="py-3 px-4 font-black text-slate-900 text-sm">
                      {cut.closing_value}
                    </td>
                    <td className="py-3 px-4 text-slate-600">Round {cut.round_number}</td>
                    <td className="py-3 px-4">
                      <a
                        href={cut.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-600 hover:underline flex items-center space-x-1"
                      >
                        <span>Archive Link</span>
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
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-400">Academic Year</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700">
                    {fee.academic_year}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Annual Tuition Fee:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      ₹{fee.annual_tuition_fee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hostel Rent (Annual):</span>
                    <span className="font-bold text-slate-800">
                      {fee.hostel_fee_annual ? `₹${fee.hostel_fee_annual.toLocaleString()}` : 'Not Documented'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mess / Boarding (Annual):</span>
                    <span className="font-bold text-slate-800">
                      {fee.mess_fee_annual ? `₹${fee.mess_fee_annual.toLocaleString()}` : 'Dividing system / N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-800">Total Estimated Annual:</span>
                    <span className="font-black text-sky-700 text-base">
                      ₹{fee.total_annual_estimate.toLocaleString()}
                    </span>
                  </div>
                </div>

                {fee.fee_breakdown_notes && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {fee.fee_breakdown_notes}
                  </p>
                )}

                <div className="pt-2 text-[11px] text-slate-400 flex justify-between items-center">
                  <span>Verified: {fee.last_verified}</span>
                  <a
                    href={fee.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 hover:underline flex items-center space-x-0.5"
                  >
                    <span>Schedule Link</span>
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
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-400">Reporting Year</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                    Graduating Batch {plc.reporting_year}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-2">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Placement Rate</div>
                    <div className="text-lg font-black text-emerald-600 mt-0.5">
                      {plc.placement_percentage ? `${plc.placement_percentage}%` : 'N/A'}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Median CTC</div>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {plc.median_package_lpa ? `₹${plc.median_package_lpa} L` : 'N/A'}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Highest CTC</div>
                    <div className="text-lg font-black text-indigo-600 mt-0.5">
                      {plc.highest_package_lpa ? `₹${plc.highest_package_lpa} L` : 'N/A'}
                    </div>
                  </div>
                </div>

                {plc.top_recruiters && (
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-slate-700">Prominent Recruiters:</span>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {plc.top_recruiters}
                    </p>
                  </div>
                )}

                <div className="pt-2 text-[11px] text-slate-400 flex justify-between items-center">
                  <span>Audited: {plc.verification_date}</span>
                  <a
                    href={plc.source_report_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 hover:underline flex items-center space-x-0.5"
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
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-slate-900">
                  {sch.scholarship_name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {sch.merit_or_need}
                </span>
              </div>

              <div className="text-xs text-sky-800 font-bold bg-sky-50 p-2 rounded-lg border border-sky-100">
                Award: {sch.award_amount_or_waiver}
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800">Eligibility:</span>
                <p>{sch.eligibility_criteria}</p>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 flex justify-between items-center">
                <span>Source: {sch.source_title}</span>
                {sch.application_url && (
                  <a
                    href={sch.application_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 hover:underline flex items-center space-x-0.5"
                  >
                    <span>Portal</span>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Official Data Sources & Transparency Log
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All cutoff records, fees, and statistics for {college.name} have been extracted from verified government bodies, counselling portals, and institutional audit reports.
          </p>
          <div className="space-y-3">
            {college.sources.map((src, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{src.source_name}</div>
                  <div className="text-slate-500">
                    Authority: {src.authority} • Academic Year: {src.year} {src.verified_date ? `• Verified: ${src.verified_date}` : ''}
                  </div>
                </div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-sky-700 hover:bg-sky-50 font-semibold flex items-center space-x-1"
                >
                  <span>Verify Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
