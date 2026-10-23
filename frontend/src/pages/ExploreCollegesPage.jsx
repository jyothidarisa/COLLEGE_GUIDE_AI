import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Award, 
  ArrowRight, 
  PlusCircle, 
  Check, 
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
          Explore Engineering Colleges
        </h1>
        <p className="text-sm text-charcoal-muted mt-1.5 font-medium">
          Browse central, state government, and autonomous institutions with official cutoffs and audited fee structures.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-beige-200 shadow-warm-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by college name, city (e.g. CEG, Chennai, Trichy)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-beige-300 bg-ivory/50 text-sm text-charcoal placeholder-charcoal-muted/70 focus:outline-none focus:ring-2 focus:ring-butter-400 focus:border-butter-500 transition-all font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-butter-500 hover:bg-butter-600 text-charcoal font-bold text-sm transition-all shadow-warm-sm active:scale-[0.99] whitespace-nowrap"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-beige-200 text-xs">
          <span className="font-bold text-charcoal flex items-center space-x-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-butter-700" />
            <span>Filter By:</span>
          </span>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-beige-300 bg-white text-charcoal font-medium outline-none focus:ring-2 focus:ring-butter-400"
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
            className="px-3 py-1.5 rounded-xl border border-beige-300 bg-white text-charcoal font-medium outline-none focus:ring-2 focus:ring-butter-400"
          >
            <option value="All">All States</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Karnataka">Karnataka</option>
          </select>

          <span className="text-charcoal-muted ml-auto font-medium">
            Showing <strong className="text-charcoal font-bold">{colleges.length}</strong> institutions
          </span>
        </div>
      </div>

      {/* Colleges Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-butter-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-charcoal-muted font-medium">Loading colleges...</p>
        </div>
      ) : colleges.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-beige-200 text-center text-charcoal-muted text-sm shadow-warm-sm font-medium">
          No colleges found matching the selected search criteria. Try adjusting your search term or filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colleges.map((col) => {
            const isCompared = compareList.some((c) => c.id === col.id);

            return (
              <div
                key={col.id}
                className="group bg-white rounded-2xl border border-beige-200 shadow-warm-sm hover:shadow-warm transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Campus Image Header */}
                  <div className="relative h-44 w-full bg-cream overflow-hidden">
                    <img
                      src={col.image_url || "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80"}
                      alt={col.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80";
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent"></div>
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

                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-charcoal leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-butter-800 transition-colors">
                        {col.name}
                      </h3>
                      <div className="flex items-center text-xs text-charcoal-muted mt-1.5 space-x-2 font-medium">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-butter-700 flex-shrink-0" />
                          <span>{col.city}, {col.state}</span>
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-charcoal">Code: {col.code}</span>
                      </div>
                    </div>

                    {/* Summary Metric Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-beige-200">
                      <div className="p-2.5 rounded-xl bg-cream/70 border border-beige-200">
                        <div className="text-[10px] text-charcoal-muted font-medium">Annual Tuition</div>
                        <div className="font-bold text-charcoal mt-0.5">
                          {col.annual_tuition_fee ? `₹${col.annual_tuition_fee.toLocaleString()}` : 'Subsidized'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-cream/70 border border-beige-200">
                        <div className="text-[10px] text-charcoal-muted font-medium">Median CTC</div>
                        <div className="font-bold text-charcoal mt-0.5">
                          {col.median_package_lpa ? `₹${col.median_package_lpa} LPA` : 'Verified'}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-charcoal-muted font-medium">
                      Verified Programs: <strong className="text-charcoal font-bold">{col.course_count} B.Tech/B.E. Specializations</strong>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-cream/40 border-t border-beige-200 flex items-center justify-between text-xs">
                  <button
                    onClick={() => addToCompare({ id: col.id, name: col.name, code: col.code })}
                    disabled={isCompared}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
                      isCompared
                        ? 'bg-butter-200 text-charcoal border border-butter-400/60 cursor-default shadow-xs'
                        : 'bg-white border border-beige-300 text-charcoal hover:bg-cream'
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

                  <Link
                    to={`/colleges/${col.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-butter-500 hover:bg-butter-600 text-charcoal font-bold flex items-center space-x-1.5 transition-all shadow-warm-sm hover:shadow"
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
