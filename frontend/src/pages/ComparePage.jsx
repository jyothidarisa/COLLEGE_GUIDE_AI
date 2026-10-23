import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  Trash2 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useApp } from '../context/AppContext';
import api from '../services/api';

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare, addToCompare } = useApp();
  const [comparisonData, setComparisonData] = useState(null);
  const [allColleges, setAllColleges] = useState([]);
  const [selectedToAdd, setSelectedToAdd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getColleges().then((res) => {
      if (res && res.colleges) {
        setAllColleges(res.colleges);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (compareList.length >= 2) {
      setLoading(true);
      setError(null);
      const ids = compareList.map((c) => c.id);
      api.compareColleges(ids)
        .then((data) => {
          setComparisonData(data);
        })
        .catch((err) => {
          setError(err.response?.data?.detail || 'Failed to generate comparison.');
        })
        .finally(() => setLoading(false));
    } else {
      setComparisonData(null);
    }
  }, [compareList]);

  const handleAddCollege = () => {
    if (!selectedToAdd) return;
    const col = allColleges.find((c) => c.id === parseInt(selectedToAdd));
    if (col) {
      addToCompare(col);
      setSelectedToAdd('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-beige-200 shadow-warm-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-butter-800 font-bold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-butter-700" />
            <span>Side-by-Side College Comparison</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
            Compare Engineering Colleges
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1 font-medium">
            Compare annual tuition fees, audited median placement packages, NIRF ratings, and admission cutoffs for 2 to 4 colleges.
          </p>
        </div>

        {compareList.length > 0 && (
          <button
            onClick={clearCompare}
            className="px-4 py-2 rounded-xl border border-beige-300 hover:bg-cream text-charcoal-muted hover:text-charcoal text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Comparison ({compareList.length})</span>
          </button>
        )}
      </div>

      {/* College Tray Selection / Add Bar - Responsive Flex Layout */}
      <div className="p-4 sm:p-5 rounded-2xl bg-cream/70 border border-beige-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-warm-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-charcoal">Selected ({compareList.length}/4):</span>
          {compareList.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-beige-300 text-xs font-bold text-charcoal shadow-xs"
            >
              <span>{c.code || c.name}</span>
              <button
                onClick={() => removeFromCompare(c.id)}
                className="text-charcoal-muted hover:text-charcoal font-bold ml-1 text-sm leading-none"
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}
          {compareList.length === 0 && (
            <span className="text-xs text-charcoal-muted italic">No colleges added yet.</span>
          )}
        </div>

        {compareList.length < 4 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedToAdd}
              onChange={(e) => setSelectedToAdd(e.target.value)}
              className="px-3 py-2 rounded-xl border border-beige-300 bg-white text-xs text-charcoal font-medium outline-none focus:ring-2 focus:ring-butter-400 max-w-full sm:max-w-xs"
            >
              <option value="">+ Add another college to compare</option>
              {allColleges
                .filter((c) => !compareList.some((sel) => sel.id === c.id))
                .map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name} ({col.code})
                  </option>
                ))}
            </select>
            <button
              onClick={handleAddCollege}
              disabled={!selectedToAdd}
              className="px-4 py-2 rounded-xl bg-butter-500 hover:bg-butter-600 disabled:opacity-50 text-charcoal text-xs font-bold shadow-warm-sm transition-all whitespace-nowrap"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Insufficient Colleges State */}
      {compareList.length < 2 && (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-beige-200 text-center space-y-4 shadow-warm-sm">
          <Layers className="w-12 h-12 text-beige-400 mx-auto" />
          <h2 className="text-lg font-bold text-charcoal">Select at Least Two Colleges to Compare</h2>
          <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto font-medium">
            Choose colleges from your recommended options or browse the directory to view side-by-side fee comparisons, NIRF ratings, and audited CTC packages.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link
              to="/recommendations"
              className="px-5 py-2.5 rounded-xl bg-butter-500 hover:bg-butter-600 text-charcoal text-xs font-bold shadow-warm-sm transition-all text-center"
            >
              View Recommended Options
            </Link>
            <Link
              to="/colleges"
              className="px-5 py-2.5 rounded-xl bg-white border border-beige-300 text-charcoal text-xs font-bold hover:bg-cream transition-all shadow-warm-sm text-center"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-3 border-butter-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs text-charcoal-muted font-medium">Compiling comparison matrix...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-cream border border-beige-300 text-charcoal text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Comparison Content */}
      {comparisonData && !loading && (
        <div className="space-y-8">
          {/* Visual Charts: Recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Tuition & Hostel Fees */}
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-beige-200 shadow-warm-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-charcoal">
                  Annual Tuition & Hostel Cost (₹ INR)
                </h3>
                <span className="text-[11px] text-charcoal-muted font-medium">2024 Verified</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData.metric_charts.fees}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE2D1" />
                    <XAxis dataKey="college" tick={{ fontSize: 12, fill: '#38352D' }} />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#777166' }}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} 
                    />
                    <Tooltip 
                      formatter={(val) => [`₹${val.toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: '#38352D', borderRadius: '12px', color: '#FFF8E8', fontSize: '12px', border: 'none' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="tuition_fee" name="Tuition Fee" fill="#F8D982" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="hostel_fee" name="Hostel Fee" fill="#ECC558" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Placements Median vs Highest */}
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-beige-200 shadow-warm-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-charcoal">
                  Placement Packages (LPA)
                </h3>
                <span className="text-[11px] text-charcoal-muted font-medium">Audited Batch 2024</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData.metric_charts.placements}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE2D1" />
                    <XAxis dataKey="college" tick={{ fontSize: 12, fill: '#38352D' }} />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#777166' }}
                      tickFormatter={(val) => `${val} L`} 
                    />
                    <Tooltip 
                      formatter={(val) => [`₹${val} LPA`, '']}
                      contentStyle={{ backgroundColor: '#38352D', borderRadius: '12px', color: '#FFF8E8', fontSize: '12px', border: 'none' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="median_ctc" name="Median Package" fill="#F8D982" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="highest_ctc" name="Highest Package" fill="#ECC558" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Matrix Table */}
          <div className="bg-white rounded-2xl border border-beige-200 shadow-warm-sm overflow-hidden">
            <div className="p-4 bg-cream/70 border-b border-beige-200 text-xs font-bold text-charcoal">
              Detailed College Comparison Matrix
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-cream text-charcoal uppercase font-bold text-[10px] tracking-wider border-b border-beige-200">
                  <tr>
                    <th className="py-3 px-4 w-1/4">Metric / Attribute</th>
                    {comparisonData.comparison_matrix.college_columns.map((col) => (
                      <th key={col.id} className="py-3 px-4">
                        <div className="font-extrabold text-charcoal text-xs">{col.name}</div>
                        <div className="text-[10px] text-charcoal-muted font-medium">Code: {col.code}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-200">
                  {comparisonData.comparison_matrix.attributes.map((attr, idx) => (
                    <tr key={idx} className="hover:bg-cream/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-charcoal bg-cream/30">
                        {attr}
                      </td>
                      {comparisonData.comparison_matrix.college_columns.map((col) => {
                        const val = col.values[attr];
                        const isUnavailable = !val || val === 'Not documented' || val === 'Pending verification' || val === 'Not reported';
                        return (
                          <td key={col.id} className="py-3.5 px-4">
                            {isUnavailable ? (
                              <span className="text-charcoal-muted/70 italic">Not documented</span>
                            ) : (
                              <span className="font-semibold text-charcoal">{val}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
