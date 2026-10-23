import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldCheck, 
  ExternalLink, 
  Upload, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  AlertCircle 
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
          <div className="flex items-center space-x-2 text-butter-800 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-butter-700" />
            <span>Transparency & Verification Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
            College Information Sources & Archives
          </h1>
          <p className="text-sm text-charcoal-muted mt-1 font-medium">
            Every cutoff score, tuition fee structure, and placement package is backed by official institutional documents.
          </p>
        </div>

        <button
          onClick={() => setShowAdmin(!showAdmin)}
          className="px-4 py-2.5 rounded-xl border border-beige-300 hover:bg-cream text-xs font-bold text-charcoal flex items-center space-x-1.5 transition-all shadow-xs whitespace-nowrap"
        >
          <Lock className="w-3.5 h-3.5 text-butter-700" />
          <span>{showAdmin ? 'Hide Ingestion Tools' : 'Admin Ingestion'}</span>
        </button>
      </div>

      {/* Admin Ingestion Section */}
      {showAdmin && (
        <div className="bg-charcoal text-ivory p-6 sm:p-8 rounded-2xl shadow-warm space-y-6 border border-beige-300/40">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center space-x-2 text-butter-300">
                <Upload className="w-5 h-5 text-butter-400" />
                <span>Authorized Document Archive & Indexing</span>
              </h2>
              <p className="text-xs text-cream/70 mt-1">
                Upload official PDF brochures or institutional reports. Extracts text, verifies SHA-256 integrity, and adds to the admissions search catalog.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-white/10 text-[10px] font-mono text-butter-200 border border-white/10">
              Role: Authorized Admin
            </span>
          </div>

          {adminStatus && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
                adminStatus.success
                  ? 'bg-butter-900/60 text-butter-200 border border-butter-500/50'
                  : 'bg-red-950/80 text-red-200 border border-red-800'
              }`}
            >
              {adminStatus.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-butter-400" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              )}
              <span>{adminStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-cream/80 font-bold mb-1.5">
                  Admin Key (X-Admin-Key) *
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin secret key"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal/80 border border-white/20 text-white outline-none focus:border-butter-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-cream/80 font-bold mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. CEG TNEA 2024 Guidelines"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal/80 border border-white/20 text-white outline-none focus:border-butter-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-cream/80 font-bold mb-1.5">
                  Document Category
                </label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal/80 border border-white/20 text-white outline-none focus:border-butter-400 font-medium"
                >
                  <option value="Brochure">Brochure</option>
                  <option value="Cutoff_Table">Cutoff Table</option>
                  <option value="Fee_Structure">Fee Structure</option>
                  <option value="Placement_Report">Placement Report</option>
                  <option value="Admission_Guidelines">Admission Guidelines</option>
                </select>
              </div>

              <div>
                <label className="block text-cream/80 font-bold mb-1.5">
                  Academic Year
                </label>
                <input
                  type="number"
                  value={uploadYear}
                  onChange={(e) => setUploadYear(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal/80 border border-white/20 text-white outline-none focus:border-butter-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-cream/80 font-bold mb-1.5">
                  College Code (Optional)
                </label>
                <input
                  type="text"
                  value={uploadCollegeCode}
                  onChange={(e) => setUploadCollegeCode(e.target.value)}
                  placeholder="e.g. CEG-0001, IITM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal/80 border border-white/20 text-white outline-none focus:border-butter-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-cream/80 font-bold mb-1.5">
                  Official Source URL *
                </label>
                <input
                  type="url"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://ceg.annauniv.edu/fees.pdf"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal/80 border border-white/20 text-white outline-none focus:border-butter-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-cream/80 font-bold text-xs mb-1.5">
                Upload PDF / Document File *
              </label>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setUploadFile(e.target.files[0])}
                required
                className="w-full text-xs text-cream/70 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-butter-500 file:text-charcoal hover:file:bg-butter-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={adminLoading}
                className="px-5 py-2.5 rounded-xl bg-butter-500 hover:bg-butter-600 text-charcoal font-bold text-xs disabled:opacity-50 transition-all shadow-warm-sm flex items-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ingest Document</span>
              </button>

              <button
                type="button"
                onClick={handleReindex}
                disabled={adminLoading}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs disabled:opacity-50 transition-all flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Update Search Index</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Verified Sources Directory Table */}
      <div className="bg-white rounded-2xl border border-beige-200 shadow-warm-sm overflow-hidden">
        <div className="p-5 bg-cream/70 border-b border-beige-200 flex justify-between items-center">
          <div className="text-xs font-bold text-charcoal">
            Official Sources Catalog ({sources.length} Verified Entries)
          </div>
          <span className="text-[11px] text-charcoal-muted font-medium">Audited through 2024</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-charcoal-muted font-medium">
            Loading sources directory...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-cream text-charcoal uppercase font-bold text-[10px] tracking-wider border-b border-beige-200">
                <tr>
                  <th className="py-3 px-4">College / Institution</th>
                  <th className="py-3 px-4">Authority Name</th>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4">Last Verified</th>
                  <th className="py-3 px-4">Official Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-200">
                {sources.map((src) => (
                  <tr key={src.id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-charcoal">
                      {src.college_name || 'Central / Regulatory'}
                    </td>
                    <td className="py-3.5 px-4 text-charcoal font-medium">
                      {src.authority_name}
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-muted font-medium">
                      {src.source_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-md bg-cream border border-beige-200 text-charcoal font-bold text-[11px]">
                        {src.source_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-charcoal">
                      {src.academic_year}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-800 font-semibold">
                      {src.last_verified_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-butter-800 hover:text-butter-900 flex items-center space-x-1 font-bold"
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
        )}
      </div>
    </div>
  );
}
