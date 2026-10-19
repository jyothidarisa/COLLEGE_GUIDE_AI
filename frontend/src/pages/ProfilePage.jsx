import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Sparkles, 
  RotateCcw, 
  HelpCircle, 
  AlertCircle, 
  Check, 
  IndianRupee,
  Building,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { studentProfile, setStudentProfile, setRecommendations } = useApp();

  const [formData, setFormData] = useState({
    student_name: studentProfile?.student_name || '',
    state: studentProfile?.state || 'Tamil Nadu',
    preferred_city: studentProfile?.preferred_city || '',
    preferred_degree: studentProfile?.preferred_degree || 'B.Tech',
    preferred_course: studentProfile?.preferred_course || 'CSE',
    class10_percentage: studentProfile?.class10_percentage || '',
    class12_percentage: studentProfile?.class12_percentage || '',
    pcm_percentage: studentProfile?.pcm_percentage || '',
    entrance_exam: studentProfile?.entrance_exam || 'TNEA',
    rank_or_score: studentProfile?.rank_or_score || '',
    admission_year: studentProfile?.admission_year || 2024,
    category: studentProfile?.category || 'OC',
    quota: studentProfile?.quota || 'General',
    max_tuition_budget: studentProfile?.max_tuition_budget || '',
    max_total_budget: studentProfile?.max_total_budget || '',
    hostel_required: studentProfile?.hostel_required || false,
    preferred_college_type: studentProfile?.preferred_college_type || 'All',
    placement_priority: studentProfile?.placement_priority || 'High',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleClear = () => {
    setFormData({
      student_name: '',
      state: 'Tamil Nadu',
      preferred_city: '',
      preferred_degree: 'B.Tech',
      preferred_course: 'CSE',
      class10_percentage: '',
      class12_percentage: '',
      pcm_percentage: '',
      entrance_exam: 'TNEA',
      rank_or_score: '',
      admission_year: 2024,
      category: 'OC',
      quota: 'General',
      max_tuition_budget: '',
      max_total_budget: '',
      hostel_required: false,
      preferred_college_type: 'All',
      placement_priority: 'High',
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    const score = parseFloat(formData.rank_or_score);
    if (isNaN(score)) {
      setError('Please provide a valid entrance exam score or rank.');
      return;
    }

    if (formData.entrance_exam === 'TNEA' && (score < 40 || score > 200)) {
      setError('For TNEA, cutoff mark must be between 40.0 and 200.0.');
      return;
    }

    if (formData.entrance_exam === 'BITSAT' && (score < 40 || score > 390)) {
      setError('For BITSAT, score must be between 40 and 390.');
      return;
    }

    if (formData.entrance_exam !== 'TNEA' && formData.entrance_exam !== 'BITSAT' && score < 1) {
      setError(`For ${formData.entrance_exam}, rank must be a positive integer.`);
      return;
    }

    const payload = {
      student_name: formData.student_name || null,
      state: formData.state || null,
      preferred_city: formData.preferred_city || null,
      preferred_degree: formData.preferred_degree,
      preferred_course: formData.preferred_course,
      class10_percentage: formData.class10_percentage ? parseFloat(formData.class10_percentage) : null,
      class12_percentage: formData.class12_percentage ? parseFloat(formData.class12_percentage) : null,
      pcm_percentage: formData.pcm_percentage ? parseFloat(formData.pcm_percentage) : null,
      entrance_exam: formData.entrance_exam,
      rank_or_score: score,
      admission_year: parseInt(formData.admission_year),
      category: formData.category,
      quota: formData.quota,
      max_tuition_budget: formData.max_tuition_budget ? parseFloat(formData.max_tuition_budget) : null,
      max_total_budget: formData.max_total_budget ? parseFloat(formData.max_total_budget) : null,
      hostel_required: formData.hostel_required,
      preferred_college_type: formData.preferred_college_type,
      placement_priority: formData.placement_priority,
    };

    setLoading(true);
    try {
      const res = await api.getRecommendations(payload);
      setStudentProfile(payload);
      setRecommendations(res);
      navigate('/recommendations');
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Error fetching recommendations.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 text-sky-600 font-semibold text-xs tracking-wider uppercase mb-2">
          <Compass className="w-4 h-4" />
          <span>Step 1: Student Eligibility Assessment</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Enter Your Academic Profile & Preferences
        </h1>
        <p className="mt-1 text-slate-600 text-sm">
          Fields adapt automatically to your chosen admission route (TNEA, JEE Main, JEE Advanced).
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
          <div>
            <span className="font-bold">Validation Alert: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* Section 1: Basic Information */}
        <div>
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-black flex items-center justify-center">1</span>
            <span>Student & Location Preferences</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Name (Optional)
              </label>
              <input
                type="text"
                name="student_name"
                value={formData.student_name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Home State
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Kerala">Kerala</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Other">Other State (All India)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred City (Optional)
              </label>
              <input
                type="text"
                name="preferred_city"
                value={formData.preferred_city}
                onChange={handleChange}
                placeholder="e.g. Chennai, Coimbatore, Trichy"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Target Specialization & Degree */}
        <div>
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-black flex items-center justify-center">2</span>
            <span>Program & Specialization</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Degree
              </label>
              <select
                name="preferred_degree"
                value={formData.preferred_degree}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                <option value="B.Tech">B.Tech (Bachelor of Technology)</option>
                <option value="B.E.">B.E. (Bachelor of Engineering)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Branch / Specialization *
              </label>
              <select
                name="preferred_course"
                value={formData.preferred_course}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                <option value="CSE">Computer Science and Engineering (CSE)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="AI_DS">Artificial Intelligence & Data Science (AI & DS)</option>
                <option value="ECE">Electronics and Communication (ECE)</option>
                <option value="EE">Electrical Engineering (EE / EEE)</option>
                <option value="MECH">Mechanical Engineering (MECH)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Academic Qualifications */}
        <div>
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-black flex items-center justify-center">3</span>
            <span>Board Examination Marks</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Class 10 Percentage
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                name="class10_percentage"
                value={formData.class10_percentage}
                onChange={handleChange}
                placeholder="e.g. 92.5"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Class 12 Total Percentage
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                name="class12_percentage"
                value={formData.class12_percentage}
                onChange={handleChange}
                placeholder="e.g. 94.0"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Class 12 PCM % (Physics, Chem, Math)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                name="pcm_percentage"
                value={formData.pcm_percentage}
                onChange={handleChange}
                placeholder="e.g. 96.0"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Used for hard eligibility verification</span>
            </div>
          </div>
        </div>

        {/* Section 4: Entrance Examination (Conditional Form Fields) */}
        <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100">
          <h2 className="text-base font-bold text-slate-900 border-b border-sky-200/60 pb-2 mb-4 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-black flex items-center justify-center">4</span>
            <span>Entrance Examination & Score (Route-Specific)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Admission Route / Exam *
              </label>
              <select
                name="entrance_exam"
                value={formData.entrance_exam}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-sky-300 bg-white text-sm font-bold text-sky-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                <option value="TNEA">TNEA (Tamil Nadu Engineering Admissions)</option>
                <option value="JEE_MAIN">JEE Main (JoSAA / CSAB / NITs / IIITs)</option>
                <option value="JEE_ADVANCED">JEE Advanced (IIT Admissions)</option>
                <option value="BITSAT">BITSAT (BITS Pilani Admissions)</option>
                <option value="VITEEE">VITEEE (VIT Deemed University)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                {formData.entrance_exam === 'TNEA'
                  ? 'Normalized Cutoff Mark (Out of 200) *'
                  : formData.entrance_exam === 'BITSAT'
                  ? 'BITSAT Score (Out of 390) *'
                  : 'All India Rank (AIR) *'}
              </label>
              <input
                type="number"
                step={formData.entrance_exam === 'TNEA' ? '0.01' : '1'}
                name="rank_or_score"
                value={formData.rank_or_score}
                onChange={handleChange}
                placeholder={
                  formData.entrance_exam === 'TNEA'
                    ? 'e.g. 197.50'
                    : formData.entrance_exam === 'BITSAT'
                    ? 'e.g. 335'
                    : 'e.g. 1450'
                }
                required
                className="w-full px-3 py-2 rounded-lg border border-sky-300 bg-white text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
              <span className="text-[11px] text-sky-700">
                {formData.entrance_exam === 'TNEA'
                  ? 'Calculate: Maths(100) + Phy(50) + Chem(50)'
                  : formData.entrance_exam === 'BITSAT'
                  ? 'Score out of 390 in BITSAT computer test'
                  : 'Enter positive integer rank'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-sky-300 bg-white text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                {formData.entrance_exam === 'TNEA' ? (
                  <>
                    <option value="OC">OC (Open Competition)</option>
                    <option value="BC">BC (Backward Class)</option>
                    <option value="MBC">MBC (Most Backward Class)</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                  </>
                ) : (
                  <>
                    <option value="GEN">General / OPEN</option>
                    <option value="OBC-NCL">OBC-NCL</option>
                    <option value="EWS">GEN-EWS</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </>
                )}
              </select>
            </div>

            {formData.entrance_exam === 'JEE_MAIN' && (
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  NIT Quota
                </label>
                <select
                  name="quota"
                  value={formData.quota}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-sky-300 bg-white text-sm"
                >
                  <option value="Home State">Home State (Tamil Nadu)</option>
                  <option value="Other State">Other State (All India)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Budget & Hostel Constraints */}
        <div>
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-black flex items-center justify-center">5</span>
            <span>Budget & Accommodation Preferences</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Annual Tuition Budget (₹)
              </label>
              <input
                type="number"
                name="max_tuition_budget"
                value={formData.max_tuition_budget}
                onChange={handleChange}
                placeholder="e.g. 150000"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Leave blank for no tuition limit</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred College Type
              </label>
              <select
                name="preferred_college_type"
                value={formData.preferred_college_type}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                <option value="All">All Types (Govt, Aided, Private)</option>
                <option value="Central Government">Central Government (IIT/NIT)</option>
                <option value="State Government">State Government (CEG Anna Univ)</option>
                <option value="Government Aided">Government Aided (PSG Tech, TCE)</option>
                <option value="Private Autonomous">Private Autonomous (SSN)</option>
              </select>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center space-x-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  name="hostel_required"
                  checked={formData.hostel_required}
                  onChange={handleChange}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  On-Campus Hostel Required
                </span>
              </label>
              <span className="text-[11px] text-slate-400 mt-1 pl-6">
                Filters out institutions with no hostel availability
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleClear}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Form</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-base font-bold shadow-md shadow-sky-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-70 hover:scale-105"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Evaluating Historical Evidence...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Find Suitable Colleges</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
