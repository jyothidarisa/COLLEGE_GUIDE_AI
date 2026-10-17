import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  Trash2, 
  Plus, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Info, 
  Award,
  ExternalLink
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

  // Load all colleges for "Add to Compare" dropdown
  useEffect(() => {
    api.getColleges().then((res) => {
      if (res && res.colleges) {
        setAllColleges(res.colleges);
      }
    }).catch(() => {});
  }, []);

  // Fetch comparison data when compareList changes
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Multi-College Comparison Matrix</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Compare Engineering Colleges Side-by-Side
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Compare tuition costs, audited placement statistics, and official requirements for 2 to 4 colleges.
          </p>
        </div>

        {compareList.length > 0 && (
          <button
            onClick={clearCompare}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Comparison ({compareList.length})</span>
          </button>
        )}
      </div>

      {/* College Tray Selection / Add Bar */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-700">Selected Colleges ({compareList.length}/4):</span>
        {compareList.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-xs"
          >
            <span>{c.code || c.name}</span>
            <button
              onClick={() => removeFromCompare(c.id)}
              className="text-slate-400 hover:text-red-500 font-bold ml-1"
              title="Remove"
            >
              ×
            </button>
          </span>
        ))}

        {compareList.length < 4 && (
          <div className="flex items-center space-x-2 ml-auto">
            <select
              value={selectedToAdd}
              onChange={(e) => setSelectedToAdd(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 outline-none"
            >
              <option value="">+ Select another college to compare</option>
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
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-semibold"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Insufficient Colleges State */}
      {compareList.length < 2 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Select at Least Two Colleges to Compare</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Choose colleges from your recommendations or browse the directory to view side-by-side fee comparisons, NIRF ratings, and audited CTC packages.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/recommendations"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm"
            >
              View Recommended Options
            </Link>
            <Link
              to="/colleges"
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs text-slate-500">Compiling comparative metrics...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Comparison Content */}
      {comparisonData && !loading && (
        <div className="space-y-8">
          {/* Visual Charts: Recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Tuition & Hostel Fees */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">
                  Annual Tuition & Hostel Cost (₹ INR)
                </h3>
                <span className="text-[11px] text-slate-400">2024 Verified</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData.metric_charts.fees}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="college" tick={{ fontSize: 12, fill: '#475569' }} />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} 
                    />
                    <Tooltip 
                      formatter={(val) => [`₹${val.toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="tuition_fee" name="Tuition Fee" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hostel_fee" name="Hostel Fee" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Placements Median vs Highest */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">
                  Placement CTC Comparison (LPA)
                </h3>
                <span className="text-[11px] text-slate-400">Audited Batch 2024</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData.metric_charts.placements}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="college" tick={{ fontSize: 12, fill: '#475569' }} />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) => `${val} L`} 
                    />
                    <Tooltip 
                      formatter={(val) => [`₹${val} LPA`, '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="median_ctc" name="Median CTC" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="highest_ctc" name="Highest CTC" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
              Detailed Attribute Matrix
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-1/4">Metric / Attribute</th>
                    {comparisonData.comparison_matrix.college_columns.map((col) => (
                      <th key={col.id} className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 text-xs">{col.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{col.code}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonData.comparison_matrix.attributes.map((attr, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50">
                        {attr}
                      </td>
                      {comparisonData.comparison_matrix.college_columns.map((col) => {
                        const val = col.values[attr];
                        const isUnavailable = !val || val === 'Not documented' || val === 'Pending verification' || val === 'Not reported';
                        return (
                          <td key={col.id} className="py-3 px-4">
                            {isUnavailable ? (
                              <span className="text-slate-400 italic">Not documented</span>
                            ) : (
                              <span className="font-semibold text-slate-900">{val}</span>
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
