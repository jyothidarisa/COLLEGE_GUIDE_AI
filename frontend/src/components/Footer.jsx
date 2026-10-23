import React from 'react';
import { GraduationCap, ShieldCheck, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-beige-200 mt-auto">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-butter-500 text-charcoal flex items-center justify-center shadow-warm-sm border border-butter-400/50">
                <GraduationCap className="w-4 h-4 text-charcoal" />
              </div>
              <span className="font-extrabold text-lg text-charcoal">
                College Guide <span className="text-charcoal bg-butter-300 px-1.5 py-0.5 rounded text-xs font-black border border-butter-400/40">AI</span>
              </span>
            </div>
            <p className="text-sm text-charcoal-muted max-w-sm leading-relaxed font-medium">
              Your Engineering College Advisory Platform. Helping students find suitable colleges based on their rank, budget, and career goals with verified historical cutoffs and audited fees.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-muted pt-1">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-butter-700" />
                <span>Information with Sources</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-butter-700" />
                <span>Documented Sources & Archives</span>
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-3">
              Admissions Routes
            </h4>
            <ul className="space-y-2 text-sm text-charcoal-muted font-medium">
              <li className="hover:text-charcoal transition-colors">TNEA Single Window (Tamil Nadu)</li>
              <li className="hover:text-charcoal transition-colors">JEE Main / JoSAA Counselling</li>
              <li className="hover:text-charcoal transition-colors">JEE Advanced / IIT Admissions</li>
              <li className="hover:text-charcoal transition-colors">Autonomous & Deemed Universities</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-3">
              Verified Authorities
            </h4>
            <ul className="space-y-2 text-sm text-charcoal-muted font-medium">
              <li><a href="https://www.tneaonline.org" target="_blank" rel="noreferrer" className="hover:text-charcoal transition-colors">TNEA Directorate</a></li>
              <li><a href="https://josaa.nic.in" target="_blank" rel="noreferrer" className="hover:text-charcoal transition-colors">JoSAA / CSAB Portal</a></li>
              <li><a href="https://www.nirfindia.org" target="_blank" rel="noreferrer" className="hover:text-charcoal transition-colors">NIRF Ministry of Education</a></li>
              <li><Link to="/sources" className="text-charcoal font-bold underline decoration-butter-500 hover:text-butter-800">View All Verified Sources →</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-beige-200 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-charcoal-muted gap-2">
          <p>© {new Date().getFullYear()} College Guide AI. Built for Indian Engineering college applicants.</p>
          <p className="font-medium">Historical cutoffs are reference points, not future guarantees.</p>
        </div>
      </div>
    </footer>
  );
}
