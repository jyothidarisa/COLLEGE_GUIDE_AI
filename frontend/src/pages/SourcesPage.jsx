import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldCheck, 
  ExternalLink, 
  Upload, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import api from '../services/api';

export default function SourcesPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin Ingestion State
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDocType, setUploadDocType] = useState('Brochure');
  const [uploadYear, setUploadYear] = useState(2024);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadCollegeCode, setUploadCollegeCode] = useState('');
  
  const [adminStatus, setAdminStatus] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getSources()
      .then((data) => {
        setSources(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !adminKey.trim()) return;

    setAdminLoading(true);
    setAdminStatus(null);
    try {
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('doc_type', uploadDocType);
      formData.append('academic_year', uploadYear);
      formData.append('source_url', uploadUrl);
      if (uploadCollegeCode) formData.append('college_code', uploadCollegeCode);
      formData.append('file', uploadFile);

      const res = await api.adminIngest(formData, adminKey);
      setAdminStatus({ success: true, message: res.message });
      // Reset form
      setUploadFile(null);
      setUploadTitle('');
      setUploadUrl('');
    } catch (err) {
      setAdminStatus({
        success: false,
        message: err.response?.data?.detail || 'Document ingestion failed. Verify Admin Key.',
      });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleReindex = async () => {
    if (!adminKey.trim()) {
      setAdminStatus({ success: false, message: 'Please enter Admin Key to re-index vectors.' });
      return;
    }
    setAdminLoading(true);
    try {
      const res = await api.adminReindex(adminKey);
      setAdminStatus({ success: true, message: res.message });
    } catch (err) {
      setAdminStatus({
        success: false,
        message: err.response?.data?.detail || 'Reindexing failed.',
      });
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Transparency & Verification Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Data Sources & Verification Status
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Every cutoff score, tuition fee structure, and placement metric is tracked back to official authorities.
          </p>
        </div>

        <button
          onClick={() => setShowAdmin(!showAdmin)}
          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors"
        >
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>{showAdmin ? 'Hide Admin Ingestion' : 'Admin Ingestion Portal'}</span>
        </button>
      </div>

      {/* Admin Protected Ingestion Section */}
      {showAdmin && (
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center space-x-2 text-sky-400">
                <Upload className="w-5 h-5" />
                <span>Authorized Document Ingestion & Re-Indexing</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Upload official PDF brochures or institutional reports. Extracts text, chunks, computes SHA-256 hashes, and indexes vectors into FAISS.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
              Role: Authorized Admin
            </span>
          </div>

          {adminStatus && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
                adminStatus.success
                  ? 'bg-emerald-950 text-emerald-200 border border-emerald-800'
                  : 'bg-red-950 text-red-200 border border-red-800'
              }`}
            >
              {adminStatus.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              )}
              <span>{adminStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Admin Key (X-Admin-Key) *
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin secret key"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. CEG TNEA 2024 Guidelines"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Document Category
                </label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-sky-500"
                >
                  <option value="Brochure">Brochure</option>
                  <option value="Cutoff_Table">Cutoff Table</option>
                  <option value="Fee_Structure">Fee Structure</option>
                  <option value="Placement_Report">Placement Report</option>
                  <option value="Admission_Guidelines">Admission Guidelines</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Academic Year
                </label>
                <input
                  type="number"
                  value={uploadYear}
                  onChange={(e) => setUploadYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  College Code (Optional)
                </label>
                <input
                  type="text"
                  value={uploadCollegeCode}
                  onChange={(e) => setUploadCollegeCode(e.target.value)}
                  placeholder="e.g. CEG-0001, IITM"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Official Source URL *
                </label>
                <input
                  type="url"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://ceg.annauniv.edu/fees.pdf"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold text-xs mb-1">
                Upload PDF / Document File *
              </label>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setUploadFile(e.target.files[0])}
                required
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700 cursor-pointer"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={adminLoading}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs disabled:opacity-50 transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ingest Document</span>
              </button>

              <button
                type="button"
                onClick={handleReindex}
                disabled={adminLoading}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs disabled:opacity-50 transition-colors flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rebuild FAISS Index</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Verified Sources Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="text-xs font-bold text-slate-700">
            Official Sources Catalog ({sources.length} Verified Entries)
          </div>
          <span className="text-[11px] text-slate-400">Audited through 2024</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading sources directory...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">College / Authority</th>
                  <th className="py-3 px-4">Authority Name</th>
                  <th className="py-3 px-4">Source Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4">Last Verified</th>
                  <th className="py-3 px-4">Official Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sources.map((src) => (
                  <tr key={src.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {src.college_name || 'Central / Regulatory'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {src.authority_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      {src.source_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {src.source_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {src.academic_year}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-700 font-semibold">
                      {src.last_verified_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-600 hover:underline flex items-center space-x-1 font-semibold"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
