import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Home, Search, User, LogOut, MessageSquare, TrendingUp, GraduationCap, MapPin,
  Building2, ChevronRight, ChevronLeft, Plus, X, Check, Moon, Sun, Sparkles, Send,
  Copy, RefreshCw, Bookmark, ArrowUpDown, Eye, EyeOff, Mail, Lock, Phone, Award,
  Wallet, Users, Menu, ArrowRight, BadgeCheck, School, PlusCircle, Trash2, Loader2
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  TOKENS                                                                 */
/* ---------------------------------------------------------------------- */
const FONTS_LINK = "https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap";

const GLOBAL_STYLE = `
  @import url('${FONTS_LINK}');
  .cg-root { font-family: 'Inter', sans-serif; }
  .cg-display { font-family: 'Manrope', sans-serif; }
  .cg-mono { font-family: 'JetBrains Mono', monospace; }
  .cg-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .cg-scrollbar::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.35); border-radius: 8px; }
  .cg-glass { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
  @keyframes cgFadeUp { from { opacity:0; transform: translateY(14px);} to {opacity:1; transform:translateY(0);} }
  @keyframes cgFadeIn { from { opacity:0;} to {opacity:1;} }
  @keyframes cgSpin { to { transform: rotate(360deg);} }
  @keyframes cgPulseRing { 0% { stroke-dashoffset: 251; } 100% { stroke-dashoffset: var(--ring-offset); } }
  @keyframes cgShimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
  @keyframes cgFloat { 0%,100% { transform: translateY(0px);} 50% { transform: translateY(-6px);} }
  @keyframes cgBlobMove { 0%,100% { transform: translate(0,0) scale(1);} 33% { transform: translate(30px,-20px) scale(1.05);} 66% { transform: translate(-20px,15px) scale(0.97);} }
  .cg-anim-fadeup { animation: cgFadeUp 0.5s ease both; }
  .cg-anim-fadein { animation: cgFadeIn 0.4s ease both; }
  .cg-blob { animation: cgBlobMove 12s ease-in-out infinite; }
  .cg-shimmer { background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.03) 100%); background-size: 800px 100%; animation: cgShimmer 1.6s linear infinite; }
  input[type="range"].cg-slider { -webkit-appearance: none; height: 6px; border-radius: 999px; background: linear-gradient(90deg,#4F46E5,#7C3AED); }
  input[type="range"].cg-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; border: 3px solid #7C3AED; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.25); }
  .cg-card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
  .cg-card-hover:hover { transform: translateY(-4px); }
`;

const theme = (dark) => ({
  bg: dark ? "#0A0E1A" : "#F5F6FA",
  bgGrad: dark
    ? "radial-gradient(circle at 15% 10%, rgba(79,70,229,0.18), transparent 45%), radial-gradient(circle at 85% 30%, rgba(16,185,129,0.10), transparent 40%), #0A0E1A"
    : "radial-gradient(circle at 15% 10%, rgba(124,58,237,0.08), transparent 45%), radial-gradient(circle at 85% 30%, rgba(16,185,129,0.08), transparent 40%), #F5F6FA",
  surface: dark ? "rgba(255,255,255,0.045)" : "#FFFFFF",
  surfaceBorder: dark ? "rgba(255,255,255,0.09)" : "rgba(11,27,58,0.08)",
  text: dark ? "#EEF0FA" : "#0F1324",
  muted: dark ? "#98A0BE" : "#5B6178",
  navy: "#0B1B3A",
});

/* ---------------------------------------------------------------------- */
/*  MOCK DATA                                                              */
/* ---------------------------------------------------------------------- */
const BRANCHES = ["Computer Science", "AI", "Data Science", "Cyber Security", "IT", "Electronics", "Mechanical", "Civil", "Chemical", "Biotechnology", "Electrical"];
const STATES = ["Tamil Nadu", "Delhi", "Maharashtra", "Karnataka", "Telangana", "Uttar Pradesh", "West Bengal", "Rajasthan", "Punjab", "Andhra Pradesh"];
const EXAM_TYPES = ["JEE Main", "JEE Advanced", "BITSAT", "VITEEE", "SRMJEEE", "COMEDK", "KCET", "AP EAMCET", "TS EAMCET", "MHT CET", "WBJEE", "Other"];

const GRADIENTS = [
  ["#4F46E5", "#7C3AED"], ["#0B1B3A", "#4F46E5"], ["#10B981", "#0B1B3A"], ["#7C3AED", "#10B981"],
  ["#1E293B", "#7C3AED"], ["#4F46E5", "#10B981"], ["#0B1B3A", "#10B981"], ["#7C3AED", "#4338CA"],
];

function makeCollege(i, name, state, city, nirf, type, fees, avgPkg, highPkg, placement, naac) {
  const g = GRADIENTS[i % GRADIENTS.length];
  return {
    id: `col-${i}`,
    name, state, city, nirf, type, fees, avgPkg, highPkg, placement, naac,
    accreditation: "NBA Accredited",
    grad: g,
    initials: name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase(),
    cutoffPercentile: Math.max(60, 99.6 - nirf * 0.9),
    distanceBase: 80 + (i * 57) % 900,
  };
}

const COLLEGES = [
  makeCollege(0, "IIT Madras", "Tamil Nadu", "Chennai", 1, "Government", 2.2, 19.5, 62, 96, "A++"),
  makeCollege(1, "IIT Delhi", "Delhi", "New Delhi", 2, "Government", 2.2, 21.0, 60, 95, "A++"),
  makeCollege(2, "IIT Bombay", "Maharashtra", "Mumbai", 3, "Government", 2.3, 22.4, 68, 96, "A++"),
  makeCollege(3, "IIT Kanpur", "Uttar Pradesh", "Kanpur", 4, "Government", 2.2, 20.1, 58, 94, "A++"),
  makeCollege(4, "IIT Kharagpur", "West Bengal", "Kharagpur", 5, "Government", 2.2, 19.0, 55, 93, "A++"),
  makeCollege(5, "IIT Roorkee", "Uttar Pradesh", "Roorkee", 6, "Government", 2.2, 18.2, 50, 92, "A+"),
  makeCollege(6, "IIT Guwahati", "Assam", "Guwahati", 7, "Government", 2.1, 17.5, 48, 91, "A+"),
  makeCollege(7, "NIT Tiruchirappalli", "Tamil Nadu", "Trichy", 8, "Government", 1.7, 13.2, 42, 90, "A++"),
  makeCollege(8, "IIT Hyderabad", "Telangana", "Hyderabad", 9, "Government", 2.1, 16.4, 45, 91, "A+"),
  makeCollege(9, "NIT Surathkal", "Karnataka", "Mangalore", 10, "Government", 1.6, 12.8, 40, 89, "A+"),
  makeCollege(10, "IIIT Hyderabad", "Telangana", "Hyderabad", 11, "Government", 3.2, 24.0, 65, 95, "A++"),
  makeCollege(11, "BITS Pilani", "Rajasthan", "Pilani", 12, "Private", 5.4, 17.8, 52, 93, "A"),
  makeCollege(12, "VIT Vellore", "Tamil Nadu", "Vellore", 13, "Private", 4.2, 9.8, 41, 85, "A++"),
  makeCollege(13, "SRM Institute of Science & Technology", "Tamil Nadu", "Chennai", 14, "Private", 4.0, 8.6, 38, 82, "A++"),
  makeCollege(14, "Manipal Institute of Technology", "Karnataka", "Manipal", 15, "Private", 4.6, 10.2, 40, 84, "A+"),
  makeCollege(15, "NIT Warangal", "Telangana", "Warangal", 16, "Government", 1.6, 12.0, 39, 88, "A+"),
  makeCollege(16, "COMEDK Member — RV College of Engineering", "Karnataka", "Bengaluru", 17, "Private", 2.4, 11.5, 36, 86, "A"),
  makeCollege(17, "KIIT University", "Odisha", "Bhubaneswar", 18, "Private", 4.5, 9.1, 34, 83, "A+"),
  makeCollege(18, "Thapar Institute of Engineering & Technology", "Punjab", "Patiala", 19, "Private", 3.9, 10.6, 37, 84, "A"),
  makeCollege(19, "Amrita Vishwa Vidyapeetham", "Tamil Nadu", "Coimbatore", 20, "Private", 3.6, 8.9, 33, 81, "A++"),
];

const EMPTY_EXAM = () => ({ id: Math.random().toString(36).slice(2), exam: "JEE Main", percentile: "", rank: "", score: "", attempt: "1", session: "January" });

const INITIAL_STUDENT = {
  fullName: "", dob: "", gender: "Male", category: "General", state: "Tamil Nadu", district: "",
  income: "", tenthBoard: "CBSE", tenthPct: "", twelfthBoard: "CBSE", twelfthPct: "", pcm: "",
  school: "", passingYear: "2025",
  exams: [EMPTY_EXAM()],
  branches: ["Computer Science"], prefStates: ["Tamil Nadu"], collegeType: "Both",
  maxFee: 6, maxDistance: 1200, hostel: "Yes",
  interests: ["Placements"], campus: "Urban",
};

/* ---------------------------------------------------------------------- */
/*  SMALL SHARED UI PIECES                                                 */
/* ---------------------------------------------------------------------- */

function MatchRing({ score = 80, size = 56, t }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 85 ? "#10B981" : score >= 65 ? "#7C3AED" : "#F59E0B";
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={t.surfaceBorder} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="cg-mono" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.28, fontWeight: 600, color: t.text }}>
        {score}
      </div>
    </div>
  );
}

function GradientButton({ children, onClick, type = "button", full, style = {}, disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="cg-display"
      style={{
        width: full ? "100%" : "auto",
        padding: "12px 22px",
        borderRadius: 14,
        border: "none",
        background: disabled ? "#8b8ea0" : "linear-gradient(120deg,#4F46E5,#7C3AED)",
        color: "#fff",
        fontWeight: 700,
        fontSize: 14.5,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        boxShadow: disabled ? "none" : "0 8px 24px -8px rgba(124,58,237,0.55)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        ...style,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {children}
    </button>
  );
}

function GlassCard({ children, t, style = {}, hover = true, className = "" }) {
  return (
    <div
      className={`cg-glass ${hover ? "cg-card-hover" : ""} ${className}`}
      style={{
        background: t.surface,
        border: `1px solid ${t.surfaceBorder}`,
        borderRadius: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
      <span style={{ fontWeight: 600, opacity: 0.85 }}>{label}</span>
      {children}
    </label>
  );
}

function inputStyle(t) {
  return {
    padding: "11px 13px",
    borderRadius: 11,
    border: `1px solid ${t.surfaceBorder}`,
    background: t.bg === "#0A0E1A" ? "rgba(255,255,255,0.03)" : "#fff",
    color: t.text,
    fontSize: 14,
    outline: "none",
    fontFamily: "Inter, sans-serif",
  };
}

function Chip({ active, onClick, children, t }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        border: `1px solid ${active ? "transparent" : t.surfaceBorder}`,
        background: active ? "linear-gradient(120deg,#4F46E5,#7C3AED)" : "transparent",
        color: active ? "#fff" : t.text,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

function ToggleTheme({ dark, setDark, t }) {
  return (
    <button
      onClick={() => setDark(!dark)}
      style={{
        width: 40, height: 40, borderRadius: 12, border: `1px solid ${t.surfaceBorder}`,
        background: t.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: t.text,
      }}
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function Logo({ size = 30, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: size, height: size, borderRadius: size * 0.32,
        background: "linear-gradient(135deg,#0B1B3A,#4F46E5 55%,#7C3AED)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 6px 16px -6px rgba(79,70,229,0.6)",
      }}>
        <GraduationCap size={size * 0.55} color="#fff" strokeWidth={2.2} />
      </div>
      <span className="cg-display" style={{ fontWeight: 800, fontSize: size * 0.62, color: t.text, letterSpacing: -0.3 }}>
        CollegeGuide <span style={{ background: "linear-gradient(120deg,#7C3AED,#10B981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  AUTH PAGES                                                             */
/* ---------------------------------------------------------------------- */

function LoginPage({ t, dark, setDark, onLogin, goSignup }) {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div style={{ minHeight: "100vh", background: t.bgGrad, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      <div className="cg-blob" style={{ position: "absolute", top: -120, left: -100, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,#4F46E5,transparent 70%)", opacity: 0.35, filter: "blur(10px)" }} />
      <div className="cg-blob" style={{ position: "absolute", bottom: -140, right: -100, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,#10B981,transparent 70%)", opacity: 0.25, filter: "blur(10px)", animationDelay: "3s" }} />
      <div style={{ position: "absolute", top: 20, right: 20 }}><ToggleTheme dark={dark} setDark={setDark} t={t} /></div>

      <GlassCard t={t} hover={false} className="cg-anim-fadeup" style={{ width: "100%", maxWidth: 420, padding: "38px 34px", zIndex: 2 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><Logo t={t} size={34} /></div>
        <p style={{ textAlign: "center", color: t.muted, fontSize: 13.5, marginTop: 8, marginBottom: 28 }}>Guiding Every Student to the Right Engineering College.</p>

        <form onSubmit={(e) => { e.preventDefault(); onLogin(email || "student@example.com"); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Email">
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 12, top: 13, opacity: 0.5 }} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" required style={{ ...inputStyle(t), width: "100%", paddingLeft: 36, boxSizing: "border-box" }} />
            </div>
          </Field>
          <Field label="Password">
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 12, top: 13, opacity: 0.5 }} />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPw ? "text" : "password"} placeholder="••••••••" required style={{ ...inputStyle(t), width: "100%", paddingLeft: 36, paddingRight: 36, boxSizing: "border-box" }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: 11, background: "none", border: "none", cursor: "pointer", opacity: 0.55, color: t.text }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: t.muted, cursor: "pointer" }}>
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#7C3AED", fontWeight: 600, textDecoration: "none" }}>Forgot password?</a>
          </div>
          <GradientButton type="submit" full>Log in <ArrowRight size={16} /></GradientButton>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0" }}>
          <div style={{ flex: 1, height: 1, background: t.surfaceBorder }} />
          <span style={{ fontSize: 12, color: t.muted }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: t.surfaceBorder }} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => onLogin("student@example.com")} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: `1px solid ${t.surfaceBorder}`, background: "transparent", color: t.text, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Google</button>
          <button onClick={() => onLogin("student@example.com")} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: `1px solid ${t.surfaceBorder}`, background: "transparent", color: t.text, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Microsoft</button>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13.5, color: t.muted }}>
          Don't have an account?{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); goSignup(); }} style={{ color: "#7C3AED", fontWeight: 700, textDecoration: "none" }}>Sign up</a>
        </p>
      </GlassCard>
    </div>
  );
}

function SignupPage({ t, dark, setDark, onSignup, goLogin }) {
  const [agree, setAgree] = useState(false);
  return (
    <div style={{ minHeight: "100vh", background: t.bgGrad, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      <div className="cg-blob" style={{ position: "absolute", top: -100, right: -120, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,#7C3AED,transparent 70%)", opacity: 0.3, filter: "blur(10px)" }} />
      <div style={{ position: "absolute", top: 20, right: 20 }}><ToggleTheme dark={dark} setDark={setDark} t={t} /></div>

      <GlassCard t={t} hover={false} className="cg-anim-fadeup" style={{ width: "100%", maxWidth: 440, padding: "36px 34px", zIndex: 2 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><Logo t={t} size={32} /></div>
        <h2 className="cg-display" style={{ textAlign: "center", fontSize: 19, marginTop: 14, marginBottom: 22, color: t.text }}>Create your account</h2>

        <form onSubmit={(e) => { e.preventDefault(); if (agree) onSignup(); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Full Name"><input required placeholder="Ananya Sharma" style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Email"><input required type="email" placeholder="you@example.com" style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Phone Number"><input required placeholder="+91 98765 43210" style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Password"><input required type="password" placeholder="••••••••" style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Confirm Password"><input required type="password" placeholder="••••••••" style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field></div>
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: t.muted, marginTop: 4, cursor: "pointer" }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2 }} required />
            I agree to the Terms & Conditions and Privacy Policy
          </label>
          <GradientButton type="submit" full disabled={!agree}>Create Account</GradientButton>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13.5, color: t.muted }}>
          Already have an account?{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); goLogin(); }} style={{ color: "#7C3AED", fontWeight: 700, textDecoration: "none" }}>Log in</a>
        </p>
      </GlassCard>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  TOP NAV                                                                */
/* ---------------------------------------------------------------------- */

function TopNav({ t, dark, setDark, page, setPage, onLogout }) {
  const items = [
    { key: "dashboard", label: "Home", icon: Home },
    { key: "rankings", label: "NIRF Rankings", icon: Award },
    { key: "recommendations", label: "Recommended Colleges", icon: TrendingUp },
    { key: "chat", label: "AI Chat", icon: MessageSquare },
    { key: "profile", label: "Profile", icon: User },
  ];
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="cg-glass" style={{ position: "sticky", top: 0, zIndex: 40, background: dark ? "rgba(10,14,26,0.7)" : "rgba(245,246,250,0.75)", borderBottom: `1px solid ${t.surfaceBorder}` }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <div onClick={() => setPage("dashboard")} style={{ cursor: "pointer" }}><Logo t={t} size={26} /></div>
        <div className="cg-scrollbar" style={{ display: "flex", gap: 4, overflowX: "auto" }} >
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => setPage(it.key)}
              className="cg-display"
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 11, border: "none", cursor: "pointer",
                background: page === it.key ? (dark ? "rgba(124,58,237,0.18)" : "rgba(124,58,237,0.09)") : "transparent",
                color: page === it.key ? "#7C3AED" : t.text, fontWeight: 700, fontSize: 13, whiteSpace: "nowrap",
              }}
            >
              <it.icon size={15} /> {it.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ToggleTheme dark={dark} setDark={setDark} t={t} />
          <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 11, border: `1px solid ${t.surfaceBorder}`, background: "transparent", color: t.text, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  COLLEGE CARD                                                           */
/* ---------------------------------------------------------------------- */

function CollegePhoto({ college, height = 130 }) {
  return (
    <div style={{
      height, borderRadius: "16px 16px 0 0", position: "relative", overflow: "hidden",
      background: `linear-gradient(135deg, ${college.grad[0]}, ${college.grad[1]})`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.18, backgroundImage: "radial-gradient(circle at 20% 30%, #fff 0, transparent 35%), radial-gradient(circle at 80% 70%, #fff 0, transparent 30%)" }} />
      <span className="cg-display" style={{ fontSize: 30, fontWeight: 800, color: "rgba(255,255,255,0.92)", letterSpacing: 1 }}>{college.initials}</span>
      <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.16)", backdropFilter: "blur(6px)", padding: "4px 10px", borderRadius: 999, fontSize: 11.5, color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
        <BadgeCheck size={12} /> NIRF #{college.nirf}
      </div>
      <div style={{ position: "absolute", top: 10, right: 10, background: college.type === "Government" ? "rgba(16,185,129,0.85)" : "rgba(255,255,255,0.85)", padding: "4px 10px", borderRadius: 999, fontSize: 11, color: college.type === "Government" ? "#fff" : "#0B1B3A", fontWeight: 700 }}>
        {college.type}
      </div>
    </div>
  );
}

function StatRow({ icon: Icon, label, value, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, color: t.muted }}><Icon size={13} /> {label}</span>
      <span className="cg-mono" style={{ fontWeight: 600, color: t.text }}>{value}</span>
    </div>
  );
}

function CollegeCard({ college, t, onLearnMore, saved, onSave }) {
  return (
    <GlassCard t={t} className="cg-anim-fadeup" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <CollegePhoto college={college} />
      <div style={{ padding: "16px 16px 18px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <h3 className="cg-display" style={{ fontSize: 15, fontWeight: 800, color: t.text, lineHeight: 1.25, margin: 0 }}>{college.name}</h3>
          <button onClick={() => onSave(college.id)} style={{ background: "none", border: "none", cursor: "pointer", color: saved ? "#7C3AED" : t.muted, flexShrink: 0 }}>
            <Bookmark size={17} fill={saved ? "#7C3AED" : "none"} />
          </button>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: t.muted }}><MapPin size={12} /> {college.city}, {college.state}</span>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 0", borderTop: `1px solid ${t.surfaceBorder}`, borderBottom: `1px solid ${t.surfaceBorder}` }}>
          <StatRow icon={Wallet} label="Fees / yr" value={`₹${college.fees}L`} t={t} />
          <StatRow icon={TrendingUp} label="Avg Package" value={`₹${college.avgPkg}L`} t={t} />
          <StatRow icon={Award} label="Highest Package" value={`₹${college.highPkg}L`} t={t} />
          <StatRow icon={Users} label="Placement" value={`${college.placement}%`} t={t} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: "rgba(16,185,129,0.12)", color: "#0F9D6E" }}>{college.accreditation}</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: "rgba(124,58,237,0.12)", color: "#7C3AED" }}>NAAC {college.naac}</span>
        </div>
        <GradientButton onClick={() => onLearnMore(college)} full style={{ marginTop: "auto", padding: "10px 0", fontSize: 13 }}>Learn More <ChevronRight size={15} /></GradientButton>
      </div>
    </GlassCard>
  );
}

function FloatingRegisterButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="cg-display"
      style={{
        position: "fixed", bottom: 26, right: 26, zIndex: 50,
        padding: "15px 22px", borderRadius: 999, border: "none", cursor: "pointer",
        background: "linear-gradient(120deg,#4F46E5,#7C3AED)", color: "#fff", fontWeight: 800, fontSize: 14.5,
        display: "flex", alignItems: "center", gap: 8, boxShadow: "0 12px 30px -8px rgba(124,58,237,0.65)",
        animation: "cgFloat 2.6s ease-in-out infinite",
      }}
    >
      <PlusCircle size={18} /> Register
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/*  COLLEGE DETAIL MODAL                                                  */
/* ---------------------------------------------------------------------- */

function CollegeModal({ college, t, onClose }) {
  if (!college) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(5,8,16,0.6)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="cg-anim-fadeup cg-scrollbar" style={{ maxWidth: 520, width: "100%", maxHeight: "88vh", overflowY: "auto", borderRadius: 22, background: t.bg === "#0A0E1A" ? "#111528" : "#fff", border: `1px solid ${t.surfaceBorder}` }}>
        <CollegePhoto college={college} height={160} />
        <div style={{ padding: 26 }}>
          <h2 className="cg-display" style={{ fontSize: 21, fontWeight: 800, color: t.text, margin: 0 }}>{college.name}</h2>
          <p style={{ color: t.muted, fontSize: 13.5, display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}><MapPin size={14} /> {college.city}, {college.state}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
            {[
              ["NIRF Rank", `#${college.nirf}`], ["College Type", college.type],
              ["Annual Fees", `₹${college.fees}L`], ["Avg Package", `₹${college.avgPkg}L`],
              ["Highest Package", `₹${college.highPkg}L`], ["Placement %", `${college.placement}%`],
              ["Accreditation", college.accreditation], ["NAAC Grade", college.naac],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: "10px 12px", borderRadius: 12, background: t.bg === "#0A0E1A" ? "rgba(255,255,255,0.03)" : "#F5F6FA" }}>
                <div style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{label}</div>
                <div className="cg-mono" style={{ fontSize: 15, fontWeight: 700, color: t.text, marginTop: 2 }}>{val}</div>
              </div>
            ))}
          </div>
          <GradientButton full style={{ marginTop: 20 }} onClick={onClose}>Close</GradientButton>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  DASHBOARD                                                              */
/* ---------------------------------------------------------------------- */

function Dashboard({ t, dark, studentName, saved, setSaved, onOpenCollege, page }) {
  const [query, setQuery] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const perPage = 8;

  const filtered = useMemo(() => {
    let list = COLLEGES;
    if (page === "rankings") list = [...list].sort((a, b) => a.nirf - b.nirf);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.state.toLowerCase().includes(q));
    }
    return list;
  }, [query, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((pageNum - 1) * perPage, pageNum * perPage);

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 24px 100px" }}>
      {page === "dashboard" && (
        <div className="cg-anim-fadeup" style={{ textAlign: "center", marginBottom: 36 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, background: "rgba(124,58,237,0.1)", color: "#7C3AED", fontSize: 12.5, fontWeight: 700, marginBottom: 16 }}>
            <Sparkles size={13} /> AI-Powered Matching
          </span>
          <h1 className="cg-display" style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, color: t.text, margin: "0 0 12px", letterSpacing: -0.5 }}>
            Welcome{studentName ? `, ${studentName.split("@")[0]}` : ""} to CollegeGuide AI
          </h1>
          <p style={{ color: t.muted, fontSize: 15.5, maxWidth: 560, margin: "0 auto 28px" }}>
            Discover engineering colleges that perfectly match your profile using AI-powered recommendations.
          </p>
          <div style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 18, top: 16, opacity: 0.5, color: t.text }} />
            <input
              value={query} onChange={(e) => { setQuery(e.target.value); setPageNum(1); }}
              placeholder="Search colleges, cities, or states..."
              style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box", padding: "15px 18px 15px 46px", borderRadius: 16, fontSize: 15 }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 className="cg-display" style={{ fontSize: 20, fontWeight: 800, color: t.text }}>
          {page === "rankings" ? "Top Engineering Colleges — NIRF Rankings" : "Top Engineering Colleges (NIRF 2025)"}
        </h2>
        <span className="cg-mono" style={{ fontSize: 12.5, color: t.muted }}>{filtered.length} colleges</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 20 }}>
        {paged.map((c) => (
          <CollegeCard key={c.id} college={c} t={t} onLearnMore={onOpenCollege} saved={saved.has(c.id)} onSave={(id) => {
            setSaved((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
          }} />
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
          <button onClick={() => setPageNum((p) => Math.max(1, p - 1))} disabled={pageNum === 1} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${t.surfaceBorder}`, background: "transparent", color: t.text, cursor: "pointer" }}><ChevronLeft size={16} /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPageNum(n)} className="cg-mono" style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${pageNum === n ? "transparent" : t.surfaceBorder}`, background: pageNum === n ? "linear-gradient(120deg,#4F46E5,#7C3AED)" : "transparent", color: pageNum === n ? "#fff" : t.text, fontWeight: 700, cursor: "pointer" }}>{n}</button>
          ))}
          <button onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))} disabled={pageNum === totalPages} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${t.surfaceBorder}`, background: "transparent", color: t.text, cursor: "pointer" }}><ChevronRight size={16} /></button>
        </div>
      )}
      <p style={{ textAlign: "center", color: t.muted, fontSize: 11.5, marginTop: 28 }}>Sample data shown for demonstration purposes.</p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  REGISTRATION WIZARD                                                    */
/* ---------------------------------------------------------------------- */

const WIZARD_STEPS = ["Personal", "Academic", "Entrance Exams", "Preferences", "Additional", "Review"];

function WizardShell({ t, step, onClose, children, onBack, onNext, canNext = true, isLast, submitting }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,8,16,0.6)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="cg-anim-fadeup" style={{ width: "100%", maxWidth: 640, maxHeight: "92vh", display: "flex", flexDirection: "column", borderRadius: 22, background: t.bg === "#0A0E1A" ? "#111528" : "#fff", border: `1px solid ${t.surfaceBorder}`, overflow: "hidden" }}>
        <div style={{ padding: "20px 26px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 className="cg-display" style={{ fontSize: 18, fontWeight: 800, color: t.text, margin: 0 }}>Student Registration</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: t.muted }}><X size={20} /></button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
            {WIZARD_STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1 }}>
                <div style={{ height: 4, borderRadius: 999, background: i <= step ? "linear-gradient(90deg,#4F46E5,#7C3AED)" : t.surfaceBorder, transition: "background 0.3s" }} />
                <div className="cg-mono" style={{ fontSize: 10, color: i <= step ? "#7C3AED" : t.muted, marginTop: 5, fontWeight: 600 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="cg-scrollbar" style={{ padding: "22px 26px", overflowY: "auto", flex: 1 }}>{children}</div>
        <div style={{ padding: "16px 26px", borderTop: `1px solid ${t.surfaceBorder}`, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <button onClick={onBack} disabled={step === 0} style={{ padding: "11px 18px", borderRadius: 12, border: `1px solid ${t.surfaceBorder}`, background: "transparent", color: t.text, cursor: step === 0 ? "not-allowed" : "pointer", opacity: step === 0 ? 0.4 : 1, fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", gap: 6 }}>
            <ChevronLeft size={15} /> Back
          </button>
          <GradientButton onClick={onNext} disabled={!canNext || submitting}>
            {submitting ? <><Loader2 size={16} className="cg-spin" style={{ animation: "cgSpin 1s linear infinite" }} /> Analyzing...</> : isLast ? <>Submit Registration <Check size={16} /></> : <>Continue <ChevronRight size={16} /></>}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}

function CheckboxGrid({ options, selected, onToggle, t, cols = 2 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => onToggle(opt)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 11, cursor: "pointer", textAlign: "left",
            border: `1px solid ${active ? "#7C3AED" : t.surfaceBorder}`, background: active ? "rgba(124,58,237,0.1)" : "transparent", color: t.text, fontSize: 12.5, fontWeight: 600,
          }}>
            <span style={{ width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${active ? "#7C3AED" : t.muted}`, background: active ? "#7C3AED" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {active && <Check size={11} color="#fff" />}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function RegistrationWizard({ t, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [student, setStudent] = useState(INITIAL_STUDENT);
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setStudent((s) => ({ ...s, [k]: v }));
  const toggleArr = (k, val) => setStudent((s) => ({ ...s, [k]: s[k].includes(val) ? s[k].filter((x) => x !== val) : [...s[k], val] }));

  const addExam = () => set("exams", [...student.exams, EMPTY_EXAM()]);
  const removeExam = (id) => set("exams", student.exams.filter((e) => e.id !== id));
  const updateExam = (id, patch) => set("exams", student.exams.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const handleNext = () => {
    if (step < WIZARD_STEPS.length - 1) { setStep(step + 1); return; }
    setSubmitting(true);
    setTimeout(() => onComplete(student), 2200);
  };

  return (
    <WizardShell t={t} step={step} onClose={onClose} onBack={() => setStep((s) => Math.max(0, s - 1))} onNext={handleNext} isLast={step === WIZARD_STEPS.length - 1} submitting={submitting}>
      {submitting ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "50px 0" }}>
          <MatchRing score={92} size={90} t={t} />
          <p className="cg-display" style={{ fontWeight: 700, color: t.text, fontSize: 15 }}>Analyzing your profile...</p>
          <p style={{ color: t.muted, fontSize: 13, textAlign: "center", maxWidth: 320 }}>Matching your exam scores, academics and preferences against NIRF-ranked colleges.</p>
        </div>
      ) : (
        <>
          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Full Name"><input value={student.fullName} onChange={(e) => set("fullName", e.target.value)} style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field>
              <Field label="Date of Birth"><input type="date" value={student.dob} onChange={(e) => set("dob", e.target.value)} style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field>
              <Field label="Gender">
                <select value={student.gender} onChange={(e) => set("gender", e.target.value)} style={{ ...inputStyle(t), width: "100%" }}>
                  {["Male", "Female", "Other"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select value={student.category} onChange={(e) => set("category", e.target.value)} style={{ ...inputStyle(t), width: "100%" }}>
                  {["General", "OBC", "SC", "ST", "EWS"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="State">
                <select value={student.state} onChange={(e) => set("state", e.target.value)} style={{ ...inputStyle(t), width: "100%" }}>
                  {STATES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="District"><input value={student.district} onChange={(e) => set("district", e.target.value)} style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field>
              <Field label="Annual Family Income (₹)"><input value={student.income} onChange={(e) => set("income", e.target.value)} placeholder="e.g. 600000" style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="10th Board">
                <select value={student.tenthBoard} onChange={(e) => set("tenthBoard", e.target.value)} style={{ ...inputStyle(t), width: "100%" }}>
                  {["CBSE", "ICSE", "State Board"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="10th Percentage"><input value={student.tenthPct} onChange={(e) => set("tenthPct", e.target.value)} placeholder="e.g. 92" style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field>
              <Field label="12th Board">
                <select value={student.twelfthBoard} onChange={(e) => set("twelfthBoard", e.target.value)} style={{ ...inputStyle(t), width: "100%" }}>
                  {["CBSE", "ICSE", "State Board"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="12th Percentage"><input value={student.twelfthPct} onChange={(e) => set("twelfthPct", e.target.value)} placeholder="e.g. 90" style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field>
              <Field label="PCM Marks (%)"><input value={student.pcm} onChange={(e) => set("pcm", e.target.value)} placeholder="e.g. 94" style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field>
              <Field label="Passing Year">
                <select value={student.passingYear} onChange={(e) => set("passingYear", e.target.value)} style={{ ...inputStyle(t), width: "100%" }}>
                  {["2023", "2024", "2025", "2026"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="School Name"><input value={student.school} onChange={(e) => set("school", e.target.value)} style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {student.exams.map((exam, idx) => (
                <GlassCard key={exam.id} t={t} hover={false} style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span className="cg-display" style={{ fontWeight: 700, fontSize: 13, color: t.text }}>Exam {idx + 1}</span>
                    {student.exams.length > 1 && <button onClick={() => removeExam(exam.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444" }}><Trash2 size={15} /></button>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Exam">
                      <select value={exam.exam} onChange={(e) => updateExam(exam.id, { exam: e.target.value })} style={{ ...inputStyle(t), width: "100%" }}>
                        {EXAM_TYPES.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </Field>
                    {exam.exam === "JEE Main" && (
                      <>
                        <Field label="Attempt Number"><input value={exam.attempt} onChange={(e) => updateExam(exam.id, { attempt: e.target.value })} style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field>
                        <Field label="Session">
                          <select value={exam.session} onChange={(e) => updateExam(exam.id, { session: e.target.value })} style={{ ...inputStyle(t), width: "100%" }}>
                            {["January", "April"].map((o) => <option key={o}>{o}</option>)}
                          </select>
                        </Field>
                        <Field label="Percentile"><input value={exam.percentile} onChange={(e) => updateExam(exam.id, { percentile: e.target.value })} placeholder="e.g. 96.5" style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field>
                      </>
                    )}
                    {exam.exam === "BITSAT" && <Field label="Score"><input value={exam.score} onChange={(e) => updateExam(exam.id, { score: e.target.value })} style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field>}
                    {!["JEE Main", "BITSAT"].includes(exam.exam) && <Field label="Rank"><input value={exam.rank} onChange={(e) => updateExam(exam.id, { rank: e.target.value })} style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box" }} /></Field>}
                  </div>
                </GlassCard>
              ))}
              <button onClick={addExam} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 12, border: `1.5px dashed ${t.surfaceBorder}`, background: "transparent", color: "#7C3AED", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                <Plus size={16} /> Add another entrance exam
              </button>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 8 }}>Preferred Branches</div>
                <CheckboxGrid options={BRANCHES} selected={student.branches} onToggle={(v) => toggleArr("branches", v)} t={t} cols={3} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 8 }}>Preferred States</div>
                <CheckboxGrid options={STATES} selected={student.prefStates} onToggle={(v) => toggleArr("prefStates", v)} t={t} cols={3} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Preferred College Type">
                  <select value={student.collegeType} onChange={(e) => set("collegeType", e.target.value)} style={{ ...inputStyle(t), width: "100%" }}>
                    {["Government", "Private", "Both"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Hostel Required">
                  <select value={student.hostel} onChange={(e) => set("hostel", e.target.value)} style={{ ...inputStyle(t), width: "100%" }}>
                    {["Yes", "No"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={`Maximum Tuition Fee — ₹${student.maxFee}L / year`}>
                <input type="range" min="1" max="10" step="0.5" className="cg-slider" value={student.maxFee} onChange={(e) => set("maxFee", +e.target.value)} style={{ width: "100%" }} />
              </Field>
              <Field label={`Maximum Distance from Home — ${student.maxDistance} km`}>
                <input type="range" min="0" max="2500" step="50" className="cg-slider" value={student.maxDistance} onChange={(e) => set("maxDistance", +e.target.value)} style={{ width: "100%" }} />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 8 }}>Interested In</div>
                <CheckboxGrid options={["Placements", "Higher Studies", "Research", "Startup Ecosystem"]} selected={student.interests} onToggle={(v) => toggleArr("interests", v)} t={t} cols={2} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 8 }}>Campus Preference</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Urban", "Semi Urban", "Rural"].map((c) => (
                    <Chip key={c} t={t} active={student.campus === c} onClick={() => set("campus", c)}>{c}</Chip>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ color: t.muted, fontSize: 13.5, marginBottom: 6 }}>Review your details before submitting. Our AI will analyze this profile against 20+ NIRF-ranked colleges.</p>
              {[
                ["Name", student.fullName || "—"], ["State", student.state], ["Category", student.category],
                ["12th %", student.twelfthPct || "—"], ["Exams entered", student.exams.map((e) => e.exam).join(", ")],
                ["Preferred Branches", student.branches.join(", ") || "—"], ["College Type", student.collegeType],
                ["Max Fee", `₹${student.maxFee}L`], ["Campus", student.campus],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${t.surfaceBorder}` }}>
                  <span style={{ color: t.muted }}>{k}</span>
                  <span style={{ color: t.text, fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </WizardShell>
  );
}

/* ---------------------------------------------------------------------- */
/*  RECOMMENDATIONS PAGE                                                    */
/* ---------------------------------------------------------------------- */

function computeRecommendations(student) {
  const userPercentile = parseFloat(student?.exams?.[0]?.percentile) || 88;
  return COLLEGES.map((c) => {
    let score = 100 - Math.abs(userPercentile - c.cutoffPercentile) * 3.2;
    if (student?.branches?.length && c.type) score += 4;
    if (student?.prefStates?.includes(c.state)) score += 8;
    if (student?.collegeType === c.type || student?.collegeType === "Both") score += 6;
    if (c.fees <= (student?.maxFee || 10)) score += 6; else score -= 10;
    score = Math.max(35, Math.min(99, Math.round(score)));
    const distance = student?.prefStates?.includes(c.state) ? Math.round(c.distanceBase * 0.3) : c.distanceBase;
    const chance = score >= 85 ? "Very High" : score >= 70 ? "High" : score >= 55 ? "Medium" : "Low";
    return { ...c, score, distance, chance };
  }).sort((a, b) => b.score - a.score);
}

const SORT_OPTIONS = [
  { key: "match", label: "Highest Match" },
  { key: "fees", label: "Lowest Fees" },
  { key: "placement", label: "Highest Placement" },
  { key: "nirf", label: "Best NIRF Rank" },
  { key: "distance", label: "Nearest College" },
];

function chanceColor(chance) {
  return { "Very High": "#10B981", High: "#7C3AED", Medium: "#F59E0B", Low: "#EF4444" }[chance];
}

function RecommendationCard({ rec, t, saved, onSave }) {
  const [open, setOpen] = useState(false);
  return (
    <GlassCard t={t} className="cg-anim-fadeup" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 14 }}>
        <MatchRing score={rec.score} t={t} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <h3 className="cg-display" style={{ fontSize: 15, fontWeight: 800, color: t.text, margin: 0 }}>{rec.name}</h3>
            <button onClick={() => onSave(rec.id)} style={{ background: "none", border: "none", cursor: "pointer", color: saved ? "#7C3AED" : t.muted, flexShrink: 0 }}>
              <Bookmark size={16} fill={saved ? "#7C3AED" : "none"} />
            </button>
          </div>
          <p style={{ fontSize: 12, color: t.muted, margin: "3px 0 6px" }}>NIRF #{rec.nirf} · {rec.city}, {rec.state} · {rec.distance} km away</p>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: `${chanceColor(rec.chance)}22`, color: chanceColor(rec.chance) }}>
            {rec.chance} Admission Chance
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, padding: "10px 0", borderTop: `1px solid ${t.surfaceBorder}`, borderBottom: `1px solid ${t.surfaceBorder}` }}>
        {[["Fees", `₹${rec.fees}L`], ["Avg Pkg", `₹${rec.avgPkg}L`], ["High Pkg", `₹${rec.highPkg}L`], ["Placed", `${rec.placement}%`]].map(([l, v]) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div className="cg-mono" style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{v}</div>
            <div style={{ fontSize: 10, color: t.muted }}>{l}</div>
          </div>
        ))}
      </div>

      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#7C3AED", fontSize: 12.5, fontWeight: 700 }}>
        {open ? "Hide details" : "Why recommended? Pros & cons"} <ChevronRight size={14} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div className="cg-anim-fadein" style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
          <p style={{ color: t.muted, margin: 0 }}>
            <b style={{ color: t.text }}>Why recommended: </b>
            Matches your entered exam percentile against this college's typical cutoff, and aligns with your stated branch, state, and budget preferences.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ color: "#10B981", fontWeight: 700, marginBottom: 4 }}>Pros</div>
              <ul style={{ margin: 0, paddingLeft: 16, color: t.muted }}>
                <li>Strong {rec.placement}% placement rate</li>
                <li>{rec.naac} NAAC accreditation</li>
                <li>{rec.accreditation}</li>
              </ul>
            </div>
            <div>
              <div style={{ color: "#EF4444", fontWeight: 700, marginBottom: 4 }}>Cons</div>
              <ul style={{ margin: 0, paddingLeft: 16, color: t.muted }}>
                <li>{rec.distance > 800 ? "Far from your home state" : "Competitive intake"}</li>
                <li>{rec.fees > 3 ? "Higher tuition fee bracket" : "Limited seat availability"}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <GradientButton full style={{ padding: "9px 0", fontSize: 12.5 }}>Apply Now</GradientButton>
        <button onClick={() => onSave(rec.id)} style={{ flex: 1, padding: "9px 0", borderRadius: 14, border: `1px solid ${t.surfaceBorder}`, background: "transparent", color: t.text, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
          {saved ? "Saved ✓" : "Save College"}
        </button>
      </div>
    </GlassCard>
  );
}

function RecommendationsPage({ t, student, saved, setSaved, hasRegistered, onOpenWizard }) {
  const [sort, setSort] = useState("match");
  const recs = useMemo(() => {
    const list = computeRecommendations(student);
    const s = [...list];
    if (sort === "fees") s.sort((a, b) => a.fees - b.fees);
    if (sort === "placement") s.sort((a, b) => b.placement - a.placement);
    if (sort === "nirf") s.sort((a, b) => a.nirf - b.nirf);
    if (sort === "distance") s.sort((a, b) => a.distance - b.distance);
    return s;
  }, [student, sort]);

  if (!hasRegistered) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <Sparkles size={40} color="#7C3AED" style={{ marginBottom: 16 }} />
        <h2 className="cg-display" style={{ fontSize: 22, fontWeight: 800, color: t.text }}>No recommendations yet</h2>
        <p style={{ color: t.muted, marginTop: 8, marginBottom: 24 }}>Complete the student registration form so our AI can match you against 20+ NIRF-ranked engineering colleges.</p>
        <GradientButton onClick={onOpenWizard}>Start Registration <ArrowRight size={16} /></GradientButton>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 24px 100px" }}>
      <div className="cg-anim-fadeup" style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 className="cg-display" style={{ fontSize: "clamp(24px,3.4vw,34px)", fontWeight: 800, color: t.text, margin: "0 0 10px" }}>Colleges Recommended For You</h1>
        <p style={{ color: t.muted, fontSize: 14.5, maxWidth: 620, margin: "0 auto" }}>
          Selected based on your entrance exam scores, academic performance, preferences, NIRF rankings, placement statistics, affordability, and eligibility.
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 26 }}>
        {SORT_OPTIONS.map((o) => <Chip key={o.key} t={t} active={sort === o.key} onClick={() => setSort(o.key)}>{o.label}</Chip>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(310px,1fr))", gap: 20 }}>
        {recs.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec} t={t} saved={saved.has(rec.id)} onSave={(id) => setSaved((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  MINI MARKDOWN RENDERER                                                  */
/* ---------------------------------------------------------------------- */

function inlineFormat(text) {
  const parts = [];
  let rest = text;
  let key = 0;
  const re = /(\*\*(.+?)\*\*|`(.+?)`)/;
  while (rest.length) {
    const m = rest.match(re);
    if (!m) { parts.push(rest); break; }
    if (m.index > 0) parts.push(rest.slice(0, m.index));
    if (m[2] !== undefined) parts.push(<b key={key++}>{m[2]}</b>);
    else parts.push(<code key={key++} style={{ background: "rgba(124,58,237,0.12)", padding: "1px 5px", borderRadius: 5, fontFamily: "JetBrains Mono, monospace", fontSize: "0.9em" }}>{m[3]}</code>);
    rest = rest.slice(m.index + m[0].length);
  }
  return parts;
}

function MiniMarkdown({ text, t }) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { code.push(lines[i]); i++; }
      i++;
      blocks.push(<pre key={i} className="cg-mono cg-scrollbar" style={{ background: t.bg === "#0A0E1A" ? "rgba(255,255,255,0.05)" : "#0B1B3A", color: "#D9E0FF", padding: 12, borderRadius: 10, overflowX: "auto", fontSize: 12.5 }}>{code.join("\n")}</pre>);
      continue;
    }
    if (line.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) { rows.push(lines[i]); i++; }
      const cells = rows.filter((r) => !/^\|[\s-:|]+\|$/.test(r)).map((r) => r.split("|").slice(1, -1).map((c) => c.trim()));
      blocks.push(
        <table key={i} style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, margin: "6px 0" }}>
          <tbody>
            {cells.map((row, ri) => (
              <tr key={ri} style={{ background: ri === 0 ? "rgba(124,58,237,0.1)" : "transparent" }}>
                {row.map((c, ci) => (
                  ri === 0
                    ? <th key={ci} style={{ padding: "6px 10px", textAlign: "left", borderBottom: `1px solid ${t.surfaceBorder}`, color: t.text }}>{c}</th>
                    : <td key={ci} style={{ padding: "6px 10px", borderBottom: `1px solid ${t.surfaceBorder}`, color: t.muted }}>{inlineFormat(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      const lvl = line.match(/^#+/)[0].length;
      blocks.push(React.createElement("h" + (lvl + 2), { key: i, className: "cg-display", style: { color: t.text, margin: "10px 0 4px", fontSize: 16 - lvl } }, inlineFormat(line.replace(/^#+\s/, ""))));
      i++; continue;
    }
    if (/^(-|\*)\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^(-|\*)\s/.test(lines[i])) { items.push(lines[i].replace(/^(-|\*)\s/, "")); i++; }
      blocks.push(<ul key={i} style={{ margin: "4px 0", paddingLeft: 18, color: t.text }}>{items.map((it, ii) => <li key={ii} style={{ marginBottom: 2 }}>{inlineFormat(it)}</li>)}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, "")); i++; }
      blocks.push(<ol key={i} style={{ margin: "4px 0", paddingLeft: 18, color: t.text }}>{items.map((it, ii) => <li key={ii} style={{ marginBottom: 2 }}>{inlineFormat(it)}</li>)}</ol>);
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    blocks.push(<p key={i} style={{ margin: "4px 0", color: t.text, lineHeight: 1.6 }}>{inlineFormat(line)}</p>);
    i++;
  }
  return <div>{blocks}</div>;
}

/* ---------------------------------------------------------------------- */
/*  AI CHAT PAGE                                                           */
/* ---------------------------------------------------------------------- */

const SUGGESTED_PROMPTS = [
  "What colleges can I get with 96 percentile in JEE Main?",
  "Compare VIT and SRM.",
  "Explain CSBS branch.",
  "Best colleges under ₹2 lakh fees.",
  "What scholarships am I eligible for?",
];

const CHAT_SYSTEM_PROMPT = `You are the CollegeGuide AI assistant, an admissions counselor specialized in Indian engineering colleges, entrance exams (JEE Main/Advanced, BITSAT, VITEEE, SRMJEEE, COMEDK, KCET, and state CETs), branches, placements, fees, and scholarships. Answer clearly and concisely using markdown (headers, bold, bullet points, tables when comparing colleges). Keep responses focused and practical for a student audience. If asked something outside admissions/education, gently redirect to admissions topics.`;

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C3AED", animation: `cgFloat 1s ease-in-out ${i * 0.15}s infinite` }} />
      ))}
    </div>
  );
}

function ChatPage({ t, dark }) {
  const [conversations, setConversations] = useState([{ id: "c1", title: "New chat", messages: [] }]);
  const [activeId, setActiveId] = useState("c1");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef(null);

  const active = conversations.find((c) => c.id === activeId);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [active?.messages, loading]);

  const updateActive = (fn) => setConversations((cs) => cs.map((c) => (c.id === activeId ? fn(c) : c)));

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    updateActive((c) => ({ ...c, title: c.messages.length === 0 ? text.slice(0, 32) : c.title, messages: [...c.messages, userMsg] }));
    setInput("");
    setLoading(true);
    try {
      const history = [...(active?.messages || []), userMsg].map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: CHAT_SYSTEM_PROMPT,
          messages: history,
        }),
      });
      const data = await response.json();
      const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).filter(Boolean).join("\n") || "Sorry, I couldn't generate a response.";
      updateActive((c) => ({ ...c, messages: [...c.messages, { role: "assistant", content: text }] }));
    } catch (err) {
      updateActive((c) => ({ ...c, messages: [...c.messages, { role: "assistant", content: "I ran into an error reaching the AI service. Please try again." }] }));
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    const id = "c" + Math.random().toString(36).slice(2);
    setConversations((cs) => [{ id, title: "New chat", messages: [] }, ...cs]);
    setActiveId(id);
  };

  const regenerate = () => {
    const msgs = active.messages;
    if (msgs.length < 2) return;
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    updateActive((c) => ({ ...c, messages: c.messages.slice(0, -1) }));
    setTimeout(() => sendMessage(lastUser.content), 50);
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 65px)" }}>
      {sidebarOpen && (
        <div className="cg-scrollbar" style={{ width: 240, borderRight: `1px solid ${t.surfaceBorder}`, padding: 16, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", flexShrink: 0 }}>
          <button onClick={newChat} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, border: `1px solid ${t.surfaceBorder}`, background: "transparent", color: t.text, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            <Plus size={15} /> New Chat
          </button>
          <div style={{ fontSize: 11, color: t.muted, fontWeight: 700, marginTop: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Previous Chats</div>
          {conversations.map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)} style={{
              textAlign: "left", padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12.5,
              background: c.id === activeId ? "rgba(124,58,237,0.12)" : "transparent", color: c.id === activeId ? "#7C3AED" : t.text, fontWeight: 600,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              <MessageSquare size={12} style={{ marginRight: 6, display: "inline", verticalAlign: -2 }} />{c.title}
            </button>
          ))}
        </div>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "10px 18px", borderBottom: `1px solid ${t.surfaceBorder}`, display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: t.muted }}><Menu size={18} /></button>
          <span className="cg-display" style={{ fontWeight: 700, fontSize: 14, color: t.text }}>AI Admissions Chat</span>
        </div>

        <div ref={scrollRef} className="cg-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          {(!active || active.messages.length === 0) ? (
            <div style={{ maxWidth: 640, margin: "40px auto", textAlign: "center" }}>
              <Sparkles size={32} color="#7C3AED" style={{ marginBottom: 12 }} />
              <h2 className="cg-display" style={{ fontSize: 20, fontWeight: 800, color: t.text }}>Ask about admissions, exams & colleges</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 18 }}>
                {SUGGESTED_PROMPTS.map((p) => (
                  <button key={p} onClick={() => sendMessage(p)} style={{ padding: "9px 14px", borderRadius: 12, border: `1px solid ${t.surfaceBorder}`, background: t.surface, color: t.text, fontSize: 12.5, cursor: "pointer", textAlign: "left" }}>{p}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
              {active.messages.map((m, i) => (
                <div key={i} className="cg-anim-fadein" style={{ display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: m.role === "user" ? (dark ? "rgba(255,255,255,0.08)" : "#E7E9F5") : "linear-gradient(135deg,#4F46E5,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {m.role === "user" ? <User size={15} color={t.text} /> : <Sparkles size={15} color="#fff" />}
                  </div>
                  <div style={{ maxWidth: "80%" }}>
                    <div style={{ padding: "10px 14px", borderRadius: 16, background: m.role === "user" ? "linear-gradient(120deg,#4F46E5,#7C3AED)" : t.surface, border: m.role === "user" ? "none" : `1px solid ${t.surfaceBorder}`, color: m.role === "user" ? "#fff" : t.text }}>
                      {m.role === "user" ? <span style={{ fontSize: 14 }}>{m.content}</span> : <MiniMarkdown text={m.content} t={t} />}
                    </div>
                    {m.role === "assistant" && (
                      <div style={{ display: "flex", gap: 14, marginTop: 6, marginLeft: 4 }}>
                        <button onClick={() => navigator.clipboard?.writeText(m.content)} style={{ background: "none", border: "none", cursor: "pointer", color: t.muted, display: "flex", alignItems: "center", gap: 4, fontSize: 11.5 }}><Copy size={12} /> Copy</button>
                        {i === active.messages.length - 1 && <button onClick={regenerate} style={{ background: "none", border: "none", cursor: "pointer", color: t.muted, display: "flex", alignItems: "center", gap: 4, fontSize: 11.5 }}><RefreshCw size={12} /> Regenerate</button>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={15} color="#fff" /></div>
                  <div style={{ padding: "12px 16px", borderRadius: 16, background: t.surface, border: `1px solid ${t.surfaceBorder}` }}><TypingDots /></div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "14px 20px 20px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
            <textarea
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask anything about admissions, entrance exams, colleges, branches, placements, scholarships, eligibility, or counselling..."
              rows={1}
              style={{ ...inputStyle(t), width: "100%", boxSizing: "border-box", resize: "none", padding: "14px 52px 14px 16px", borderRadius: 18, fontSize: 14 }}
            />
            <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{
              position: "absolute", right: 8, top: 8, width: 36, height: 36, borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer",
              background: "linear-gradient(120deg,#4F46E5,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", opacity: input.trim() ? 1 : 0.5,
            }}>
              <Send size={16} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PROFILE PAGE                                                           */
/* ---------------------------------------------------------------------- */

function ProfilePage({ t, email, student, hasRegistered, saved, onEdit, onLogout }) {
  const recs = hasRegistered ? computeRecommendations(student).slice(0, 3) : [];
  const savedColleges = COLLEGES.filter((c) => saved.has(c.id));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 100px" }}>
      <GlassCard t={t} hover={false} className="cg-anim-fadeup" style={{ padding: 26, display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
        <div style={{ width: 66, height: 66, borderRadius: 18, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="cg-display" style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{(student.fullName || email || "S")[0].toUpperCase()}</span>
        </div>
        <div style={{ flex: 1 }}>
          <h2 className="cg-display" style={{ fontSize: 19, fontWeight: 800, color: t.text, margin: 0 }}>{student.fullName || "Student"}</h2>
          <p style={{ color: t.muted, fontSize: 13, margin: "3px 0 0" }}>{email}</p>
        </div>
        <button onClick={onEdit} style={{ padding: "9px 16px", borderRadius: 12, border: `1px solid ${t.surfaceBorder}`, background: "transparent", color: t.text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Edit Profile</button>
        <button onClick={onLogout} style={{ padding: "9px 16px", borderRadius: 12, border: "none", background: "rgba(239,68,68,0.1)", color: "#EF4444", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><LogOut size={14} /> Logout</button>
      </GlassCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <GlassCard t={t} hover={false} style={{ padding: 22 }}>
          <h3 className="cg-display" style={{ fontSize: 14.5, fontWeight: 800, color: t.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><School size={16} color="#7C3AED" /> Academic Details</h3>
          {[["10th %", student.tenthPct || "—"], ["12th %", student.twelfthPct || "—"], ["PCM %", student.pcm || "—"], ["School", student.school || "—"], ["Passing Year", student.passingYear]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: `1px solid ${t.surfaceBorder}` }}>
              <span style={{ color: t.muted }}>{k}</span><span style={{ color: t.text, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </GlassCard>

        <GlassCard t={t} hover={false} style={{ padding: 22 }}>
          <h3 className="cg-display" style={{ fontSize: 14.5, fontWeight: 800, color: t.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><Award size={16} color="#7C3AED" /> Entrance Exam Scores</h3>
          {(hasRegistered ? student.exams : []).length === 0 && <p style={{ color: t.muted, fontSize: 13 }}>No exams added yet.</p>}
          {(hasRegistered ? student.exams : []).map((e) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: `1px solid ${t.surfaceBorder}` }}>
              <span style={{ color: t.muted }}>{e.exam}</span>
              <span className="cg-mono" style={{ color: t.text, fontWeight: 600 }}>{e.percentile || e.rank || e.score || "—"}</span>
            </div>
          ))}
        </GlassCard>

        <GlassCard t={t} hover={false} style={{ padding: 22 }}>
          <h3 className="cg-display" style={{ fontSize: 14.5, fontWeight: 800, color: t.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><Sparkles size={16} color="#7C3AED" /> Preferences</h3>
          {[["Branches", student.branches.join(", ") || "—"], ["States", student.prefStates.join(", ") || "—"], ["College Type", student.collegeType], ["Max Fee", `₹${student.maxFee}L`], ["Campus", student.campus]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: `1px solid ${t.surfaceBorder}`, gap: 10 }}>
              <span style={{ color: t.muted, flexShrink: 0 }}>{k}</span><span style={{ color: t.text, fontWeight: 600, textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </GlassCard>

        <GlassCard t={t} hover={false} style={{ padding: 22 }}>
          <h3 className="cg-display" style={{ fontSize: 14.5, fontWeight: 800, color: t.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><Bookmark size={16} color="#7C3AED" /> Saved Colleges ({savedColleges.length})</h3>
          {savedColleges.length === 0 && <p style={{ color: t.muted, fontSize: 13 }}>You haven't saved any colleges yet.</p>}
          {savedColleges.slice(0, 5).map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: `1px solid ${t.surfaceBorder}` }}>
              <span style={{ color: t.text, fontWeight: 600 }}>{c.name}</span><span className="cg-mono" style={{ color: t.muted }}>NIRF #{c.nirf}</span>
            </div>
          ))}
        </GlassCard>
      </div>

      <GlassCard t={t} hover={false} style={{ padding: 22, marginTop: 20 }}>
        <h3 className="cg-display" style={{ fontSize: 14.5, fontWeight: 800, color: t.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><TrendingUp size={16} color="#7C3AED" /> Top Recommended Colleges</h3>
        {!hasRegistered && <p style={{ color: t.muted, fontSize: 13 }}>Complete registration to see AI recommendations here.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recs.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${t.surfaceBorder}` }}>
              <MatchRing score={r.score} size={38} t={t} />
              <div style={{ flex: 1 }}>
                <div style={{ color: t.text, fontWeight: 700, fontSize: 13.5 }}>{r.name}</div>
                <div style={{ color: t.muted, fontSize: 11.5 }}>NIRF #{r.nirf} · {r.chance} chance</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  ROOT APP                                                               */
/* ---------------------------------------------------------------------- */

export default function CollegeGuideAIApp() {
  const [dark, setDark] = useState(false);
  const [authScreen, setAuthScreen] = useState("login"); // login | signup
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [page, setPage] = useState("dashboard");
  const [showWizard, setShowWizard] = useState(false);
  const [student, setStudent] = useState(INITIAL_STUDENT);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [saved, setSaved] = useState(new Set());
  const [activeCollege, setActiveCollege] = useState(null);

  const t = theme(dark);

  if (!loggedIn) {
    return (
      <div className="cg-root" style={{ color: t.text }}>
        <style>{GLOBAL_STYLE}</style>
        {authScreen === "login" ? (
          <LoginPage t={t} dark={dark} setDark={setDark} onLogin={(e) => { setEmail(e); setLoggedIn(true); }} goSignup={() => setAuthScreen("signup")} />
        ) : (
          <SignupPage t={t} dark={dark} setDark={setDark} onSignup={() => setAuthScreen("login")} goLogin={() => setAuthScreen("login")} />
        )}
      </div>
    );
  }

  return (
    <div className="cg-root" style={{ minHeight: "100vh", background: t.bgGrad, color: t.text }}>
      <style>{GLOBAL_STYLE}</style>
      <TopNav t={t} dark={dark} setDark={setDark} page={page} setPage={setPage} onLogout={() => { setLoggedIn(false); setAuthScreen("login"); }} />

      {(page === "dashboard" || page === "rankings") && (
        <Dashboard t={t} dark={dark} studentName={email} saved={saved} setSaved={setSaved} onOpenCollege={setActiveCollege} page={page} />
      )}
      {page === "recommendations" && (
        <RecommendationsPage t={t} student={student} saved={saved} setSaved={setSaved} hasRegistered={hasRegistered} onOpenWizard={() => setShowWizard(true)} />
      )}
      {page === "chat" && <ChatPage t={t} dark={dark} />}
      {page === "profile" && (
        <ProfilePage t={t} email={email} student={student} hasRegistered={hasRegistered} saved={saved} onEdit={() => setShowWizard(true)} onLogout={() => { setLoggedIn(false); setAuthScreen("login"); }} />
      )}

      {(page === "dashboard" || page === "rankings" || page === "recommendations") && (
        <FloatingRegisterButton onClick={() => setShowWizard(true)} />
      )}

      {showWizard && (
        <RegistrationWizard
          t={t}
          onClose={() => setShowWizard(false)}
          onComplete={(data) => { setStudent(data); setHasRegistered(true); setShowWizard(false); setPage("recommendations"); }}
        />
      )}

      {activeCollege && <CollegeModal college={activeCollege} t={t} onClose={() => setActiveCollege(null)} />}
    </div>
  );
}
