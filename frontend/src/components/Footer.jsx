import React from 'react';
import { GraduationCap, ShieldCheck, Database, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-slate-900">
                College Guide <span className="text-sky-600">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm mb-4 leading-relaxed">
              Your AI-Powered Guide to the Right College. Data-grounded recommendation engine
              with verified historical cutoffs, audited placement records, and RAG conversational assistance.
            </p>
            <div className="flex items-center space-x-4 text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero Fabricated Data</span>
              </span>
              <span className="flex items-center space-x-1">
                <Database className="w-4 h-4 text-sky-500" />
                <span>FAISS + SentenceTransformers</span>
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Admissions Routes
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>TNEA Single Window (Tamil Nadu)</li>
              <li>JEE Main / JoSAA Counselling</li>
              <li>JEE Advanced / IIT Admissions</li>
              <li>Autonomous & Deemed Universities</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Verified Authorities
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="https://www.tneaonline.org" target="_blank" rel="noreferrer" className="hover:text-sky-600">TNEA Directorate</a></li>
              <li><a href="https://josaa.nic.in" target="_blank" rel="noreferrer" className="hover:text-sky-600">JoSAA / CSAB Portal</a></li>
              <li><a href="https://www.nirfindia.org" target="_blank" rel="noreferrer" className="hover:text-sky-600">NIRF Ministry of Education</a></li>
              <li><Link to="/sources" className="hover:text-sky-600 font-medium text-sky-600">View All Verified Sources →</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} College Guide AI. Built for verified Indian Engineering admissions.</p>
          <p className="mt-2 sm:mt-0">Historical cutoffs are past trends, not admission guarantees.</p>
        </div>
      </div>
    </footer>
  );
}
