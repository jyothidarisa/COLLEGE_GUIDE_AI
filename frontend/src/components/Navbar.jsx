import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  GraduationCap, 
  Compass, 
  Sparkles, 
  Layers, 
  BotMessageSquare, 
  Database,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const location = useLocation();
  const { studentProfile, compareList, clearProfile } = useApp();

  const navLinks = [
    { name: 'Home', path: '/', icon: GraduationCap },
    { name: 'Student Profile', path: '/profile', icon: Compass },
    { name: 'Recommendations', path: '/recommendations', icon: Sparkles },
    { name: 'Explore Colleges', path: '/colleges', icon: Layers },
    { 
      name: 'Compare', 
      path: '/compare', 
      icon: Layers,
      badge: compareList.length > 0 ? compareList.length : null 
    },
    { name: 'AI Assistant', path: '/chat', icon: BotMessageSquare },
    { name: 'Data & Sources', path: '/sources', icon: Database },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                  College Guide <span className="text-sky-600">AI</span>
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  RAG-Powered Admissions
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-sky-600 text-white rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action / Profile status */}
          <div className="flex items-center space-x-3">
            {studentProfile && (
              <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                    {studentProfile.student_name || 'Active Student'}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">
                    {studentProfile.entrance_exam} ({studentProfile.rank_or_score})
                  </div>
                </div>
                <button
                  onClick={clearProfile}
                  title="Clear profile"
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <Link
              to="/profile"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-sky-600 hover:bg-sky-700 shadow-sm shadow-sky-600/30 transition-all hover:shadow"
            >
              Find Colleges
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
