import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  GraduationCap, 
  Compass, 
  Sparkles, 
  Layers, 
  BotMessageSquare, 
  Database,
  Trash2,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const location = useLocation();
  const { studentProfile, compareList, clearProfile } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { name: 'Ask Questions', path: '/chat', icon: BotMessageSquare },
    { name: 'College Sources', path: '/sources', icon: Database },
  ];

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-white border-b border-beige-200 sticky top-0 z-50 shadow-warm-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" onClick={closeMenu} className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-butter-500 text-charcoal flex items-center justify-center shadow-warm-sm border border-butter-400/60 group-hover:scale-105 group-hover:bg-butter-400 transition-all flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-charcoal" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-charcoal group-hover:text-butter-800 transition-colors flex items-center space-x-1.5">
                  <span>College Guide</span>
                  <span className="text-charcoal bg-butter-300 px-1.5 py-0.5 rounded-md text-xs font-black border border-butter-400/40">AI</span>
                </span>
                <span className="hidden sm:block text-[10px] uppercase font-bold tracking-wider text-charcoal-muted truncate">
                  Engineering Admissions Advisory
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-butter-300 text-charcoal shadow-2xs border border-butter-400/60'
                      : 'text-charcoal-muted hover:text-charcoal hover:bg-cream'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-charcoal' : 'text-charcoal-muted'}`} />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="ml-1 px-1.5 py-0.2 text-[11px] font-bold bg-butter-500 text-charcoal rounded-full border border-butter-600/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action / Profile status */}
          <div className="hidden sm:flex items-center space-x-3">
            {studentProfile && (
              <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-beige-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-charcoal truncate max-w-[120px]">
                    {studentProfile.student_name || 'Active Student'}
                  </div>
                  <div className="text-[10px] text-charcoal-muted font-semibold bg-cream px-1.5 py-0.5 rounded border border-beige-200">
                    {studentProfile.entrance_exam} ({studentProfile.rank_or_score})
                  </div>
                </div>
                <button
                  onClick={clearProfile}
                  title="Clear saved profile"
                  className="p-1.5 text-charcoal-muted hover:text-red-600 hover:bg-cream rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <Link
              to="/profile"
              className="inline-flex items-center px-4 py-2 border border-butter-500 text-sm font-bold rounded-xl text-charcoal bg-butter-500 hover:bg-butter-600 shadow-warm-sm transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              Find Colleges
            </Link>
          </div>

          {/* Mobile & Tablet Hamburger Toggle */}
          <div className="flex items-center xl:hidden space-x-2">
            <Link
              to="/profile"
              className="sm:hidden inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-xl text-charcoal bg-butter-500 hover:bg-butter-600 shadow-warm-sm"
            >
              Find Colleges
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-charcoal hover:bg-cream border border-beige-200 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Collapsible Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-beige-200 px-4 pt-3 pb-5 space-y-2 shadow-warm">
          {studentProfile && (
            <div className="p-3 mb-2 rounded-xl bg-cream border border-beige-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-charcoal">
                  {studentProfile.student_name || 'Active Student Profile'}
                </div>
                <div className="text-[11px] text-charcoal-muted font-medium mt-0.5">
                  {studentProfile.entrance_exam}: Score {studentProfile.rank_or_score} • {studentProfile.preferred_course}
                </div>
              </div>
              <button
                onClick={() => {
                  clearProfile();
                  closeMenu();
                }}
                className="px-2 py-1 text-xs font-bold text-red-700 bg-white border border-red-200 rounded-lg"
              >
                Clear
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-butter-300 text-charcoal font-bold border border-butter-400/60'
                      : 'text-charcoal-muted hover:text-charcoal hover:bg-cream'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-butter-700" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-butter-500 text-charcoal rounded-full border border-butter-600/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
