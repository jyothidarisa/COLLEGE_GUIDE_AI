import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Award, 
  ShieldCheck, 
  ArrowRight, 
  PlusCircle, 
  Check, 
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import api from '../services/api';
import { useApp } from '../context/AppContext';

export default function ExploreCollegesPage() {
  const { compareList, addToCompare } = useApp();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedState, setSelectedState] = useState('All');

  const fetchColleges = () => {
    setLoading(true);
    const params = {};
    if (searchTerm.trim()) params.q = searchTerm.trim();
    if (selectedType !== 'All') params.college_type = selectedType;
    if (selectedState !== 'All') params.state = selectedState;

    api.getColleges(params)
      .then((res) => {
        setColleges(res.colleges || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchColleges();
  }, [selectedType, selectedState]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchColleges();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Explore Verified Engineering Colleges
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse verified government, autonomous, and central institutions with official cutoffs and audited fees.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by college name, city (e.g. CEG, Chennai, Trichy)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-700 flex items-center space-x-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter By:</span>
          </span>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none"
          >
            <option value="All">All College Types</option>
            <option value="Central Government">Central Government</option>
            <option value="State Government">State Government</option>
            <option value="Government Aided">Government Aided</option>
            <option value="Private Autonomous">Private Autonomous</option>
            <option value="Deemed University">Deemed University</option>
          </select>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none"
          >
            <option value="All">All States</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Karnataka">Karnataka</option>
          </select>

          <span className="text-slate-400 ml-auto">
            Showing <strong className="text-slate-700">{colleges.length}</strong> verified institutions
          </span>
        </div>
      </div>

      {/* Colleges Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading verified colleges...</p>
        </div>
      ) : colleges.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
          No colleges found matching the selected search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colleges.map((col) => {
            const isCompared = compareList.some((c) => c.id === col.id);

            return (
              <div
                key={col.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Badge Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                      {col.college_type}
                    </span>
                    {col.nirf_rank && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 flex items-center space-x-1">
                        <Award className="w-3 h-3 text-amber-600" />
                        <span>NIRF #{col.nirf_rank}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {col.name}
                    </h3>
                    <div className="flex items-center text-xs text-slate-500 mt-1 space-x-2">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{col.city}, {col.state}</span>
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">{col.code}</span>
                    </div>
                  </div>

                  {/* Summary Metric Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-medium">Tuition (Annual)</div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {col.annual_tuition_fee ? `₹${col.annual_tuition_fee.toLocaleString()}` : 'Pending'}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-medium">Median CTC</div>
                      <div className="font-bold text-emerald-600 mt-0.5">
                        {col.median_package_lpa ? `₹${col.median_package_lpa} LPA` : 'Pending'}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    Verified Programs: <strong className="text-slate-800">{col.course_count} B.Tech/B.E. Specializations</strong>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => addToCompare({ id: col.id, name: col.name, code: col.code })}
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
                    to={`/colleges/${col.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center space-x-1 transition-colors shadow-sm"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
