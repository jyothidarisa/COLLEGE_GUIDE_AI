import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenText,
  Bookmark,
  Building2,
  Check,
  ChevronRight,
  Cpu,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  User,
  Wallet,
  X,
} from 'lucide-react';
import './App.css';
import {
  getDemoSession,
  loginDemoAccount,
  logoutDemoAccount,
  registerDemoAccount,
  updateDemoProfile,
} from './demoAuth';

const collegeData = [
  {
    id: 'col-1',
    name: 'IIT Madras',
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'Government',
    fees: '₹2.2L',
    package: '₹19.5L',
    placement: '96%',
    nirf: 1,
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/IIT_Madras_campus_main_gate.jpg/960px-IIT_Madras_campus_main_gate.jpg',
    imageSource: 'https://commons.wikimedia.org/wiki/File:IIT_Madras_campus_main_gate.jpg',
  },
  {
    id: 'col-2',
    name: 'IIT Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    type: 'Government',
    fees: '₹2.2L',
    package: '₹21.0L',
    placement: '95%',
    nirf: 2,
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Iit_delhi_campus_garden.jpg/960px-Iit_delhi_campus_garden.jpg',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Iit_delhi_campus_garden.jpg',
  },
  {
    id: 'col-3',
    name: 'IIT Bombay',
    city: 'Mumbai',
    state: 'Maharashtra',
    type: 'Government',
    fees: '₹2.3L',
    package: '₹22.4L',
    placement: '96%',
    nirf: 3,
    image:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'col-4',
    name: 'NIT Tiruchirappalli',
    city: 'Trichy',
    state: 'Tamil Nadu',
    type: 'Government',
    fees: '₹1.7L',
    package: '₹13.2L',
    placement: '90%',
    nirf: 8,
    image:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'col-5',
    name: 'IIIT Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    type: 'Government',
    fees: '₹3.2L',
    package: '₹24.0L',
    placement: '95%',
    nirf: 11,
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/IIIT_Hyderabad_campus_in_Hyderabad_20.jpg/960px-IIIT_Hyderabad_campus_in_Hyderabad_20.jpg',
    imageSource: 'https://commons.wikimedia.org/wiki/File:IIIT_Hyderabad_campus_in_Hyderabad_20.jpg',
  },
  {
    id: 'col-13',
    name: 'IIT Kanpur',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    type: 'Government',
    fees: '₹2.2L',
    package: '₹20.1L',
    placement: '94%',
    nirf: 4,
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/IIT_Kanpur_4.jpg',
    imageSource: 'https://commons.wikimedia.org/wiki/File:IIT_Kanpur_4.jpg',
  },
  {
    id: 'col-14',
    name: 'IIT Kharagpur',
    city: 'Kharagpur',
    state: 'West Bengal',
    type: 'Government',
    fees: '₹2.2L',
    package: '₹19.0L',
    placement: '93%',
    nirf: 5,
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/df/IIT_Kharagpur_Campus_-_West_Midnapore_2015-09-28_4522.JPG/960px-IIT_Kharagpur_Campus_-_West_Midnapore_2015-09-28_4522.JPG',
    imageSource: 'https://commons.wikimedia.org/wiki/File:IIT_Kharagpur_Campus_-_West_Midnapore_2015-09-28_4522.JPG',
  },
  {
    id: 'col-15',
    name: 'IIT Roorkee',
    city: 'Roorkee',
    state: 'Uttarakhand',
    type: 'Government',
    fees: '₹2.2L',
    package: '₹18.2L',
    placement: '92%',
    nirf: 6,
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Main%28Administrative%29Building_IIT-Roorkee.JPG/960px-Main%28Administrative%29Building_IIT-Roorkee.JPG',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Main(Administrative)Building_IIT-Roorkee.JPG',
  },
  {
    id: 'col-16',
    name: 'IIT Guwahati',
    city: 'Guwahati',
    state: 'Assam',
    type: 'Government',
    fees: '₹2.1L',
    package: '₹17.5L',
    placement: '91%',
    nirf: 7,
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3e/SE_New_Guest_House_IIT_Guwahati_Oct24_A7CR_03204.jpg/960px-SE_New_Guest_House_IIT_Guwahati_Oct24_A7CR_03204.jpg',
    imageSource: 'https://commons.wikimedia.org/wiki/File:SE_New_Guest_House_IIT_Guwahati_Oct24_A7CR_03204.jpg',
  },
  {
    id: 'col-17',
    name: 'IIT Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    type: 'Government',
    fees: '₹2.1L',
    package: '₹16.4L',
    placement: '91%',
    nirf: 9,
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'col-6',
    name: 'VIT Vellore',
    city: 'Vellore',
    state: 'Tamil Nadu',
    type: 'Private',
    fees: '₹4.2L',
    package: '₹9.8L',
    placement: '85%',
    nirf: 13,
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/S-MH_and_T-MH_VIT%2C_Vellore_Campus.jpg/960px-S-MH_and_T-MH_VIT%2C_Vellore_Campus.jpg',
    imageSource: 'https://commons.wikimedia.org/wiki/File:S-MH_and_T-MH_VIT,_Vellore_Campus.jpg',
  },
  {
    id: 'col-7',
    name: 'BITS Pilani',
    city: 'Pilani',
    state: 'Rajasthan',
    type: 'Private',
    fees: '₹5.4L',
    package: '₹17.8L',
    placement: '93%',
    nirf: 12,
    image:
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'col-8',
    name: 'Manipal Institute of Technology',
    city: 'Manipal',
    state: 'Karnataka',
    type: 'Private',
    fees: '₹4.6L',
    package: '₹10.2L',
    placement: '84%',
    nirf: 15,
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Manipal_Institute_of_Technology_Academic_Building%2C_Manipal_University%2C_Manipal_Campus%2C_India_%28Ank_Kumar%2C_Infosys_Limited_%29_01.jpg/960px-Manipal_Institute_of_Technology_Academic_Building%2C_Manipal_University%2C_Manipal_Campus%2C_India_%28Ank_Kumar%2C_Infosys_Limited_%29_01.jpg',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Manipal_Institute_of_Technology_Academic_Building,_Manipal_University,_Manipal_Campus,_India_(Ank_Kumar,_Infosys_Limited_)_01.jpg',
  },
  {
    id: 'col-9',
    name: 'NIT Surathkal',
    city: 'Mangalore',
    state: 'Karnataka',
    type: 'Government',
    fees: '₹1.6L',
    package: '₹12.8L',
    placement: '89%',
    nirf: 10,
    image:
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'col-10',
    name: 'Amrita Vishwa Vidyapeetham',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    type: 'Private',
    fees: '₹3.6L',
    package: '₹8.9L',
    placement: '81%',
    nirf: 20,
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/Amrita_Vishwa_Vidyapeetham_Amritapuri_Campus.jpg/960px-Amrita_Vishwa_Vidyapeetham_Amritapuri_Campus.jpg',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Amrita_Vishwa_Vidyapeetham_Amritapuri_Campus.jpg',
  },
  {
    id: 'col-11',
    name: 'RV College of Engineering',
    city: 'Bengaluru',
    state: 'Karnataka',
    type: 'Private',
    fees: '₹2.4L',
    package: '₹11.5L',
    placement: '86%',
    nirf: 17,
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/RV_College_Campus.JPG/960px-RV_College_Campus.JPG',
    imageSource: 'https://commons.wikimedia.org/wiki/File:RV_College_Campus.JPG',
  },
  {
    id: 'col-12',
    name: 'KIIT University',
    city: 'Bhubaneswar',
    state: 'Odisha',
    type: 'Private',
    fees: '₹4.5L',
    package: '₹9.1L',
    placement: '83%',
    nirf: 18,
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/KIIT_Library_photo_KIIT_CSE_Branch.jpg/960px-KIIT_Library_photo_KIIT_CSE_Branch.jpg',
    imageSource: 'https://commons.wikimedia.org/wiki/File:KIIT_Library_photo_KIIT_CSE_Branch.jpg',
  },
  {
    id: 'col-18',
    name: 'SRM Institute of Science and Technology',
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'Private',
    fees: '₹4.0L',
    package: '₹8.6L',
    placement: '82%',
    nirf: 14,
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Old_Campus%2C_SRM_Institute_of_Science_and_Technology%2C_Kattankulathur_%28August%2C2024%29.jpg/960px-Old_Campus%2C_SRM_Institute_of_Science_and_Technology%2C_Kattankulathur_%28August%2C2024%29.jpg',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Old_Campus,_SRM_Institute_of_Science_and_Technology,_Kattankulathur_(August,2024).jpg',
  },
  {
    id: 'col-19',
    name: 'NIT Warangal',
    city: 'Warangal',
    state: 'Telangana',
    type: 'Government',
    fees: '₹1.6L',
    package: '₹12.0L',
    placement: '88%',
    nirf: 16,
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80',
  },
];

const quickActions = [
  { label: 'Explore Colleges', icon: Building2, target: 'dashboard' },
  { label: 'NIRF Rankings', icon: TrendingUp, target: 'rankings' },
  { label: 'Personalized shortlist', icon: Sparkles, target: 'recommendations' },
  { label: 'Compare Colleges', icon: BookOpenText, target: 'compare' },
  { label: 'CollegeGuide demo chat', icon: Cpu, target: 'assistant' },
  { label: 'My Profile', icon: User, target: 'profile' },
  { label: 'Saved Colleges', icon: Bookmark, target: 'saved' },
];

const discoveryCards = [
  { label: 'By state', description: 'Tamil Nadu, Karnataka, Delhi', emphasis: '12 states' },
  { label: 'By branch', description: 'CS, AI, Data Science, ECE', emphasis: '8+ branches' },
  { label: 'Government vs private', description: 'Compare costs and outcomes', emphasis: 'Balanced mix' },
  { label: 'Within budget', description: '₹1.5L to ₹6L options', emphasis: 'Affordable' },
  { label: 'Hostel verified', description: 'Hostel support and campus life', emphasis: 'Campus-first' },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const branchOptions = [
  'Computer Science',
  'AI & Data Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical',
  'Chemical',
  'Biotechnology',
  'Cyber Security',
];
const stateOptions = [
  'Tamil Nadu', 'Delhi', 'Maharashtra', 'Karnataka', 'Telangana',
  'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Punjab', 'Odisha',
  'Uttarakhand', 'Assam', 'Andhra Pradesh',
];
const examOptions = [
  'JEE Main', 'JEE Advanced', 'BITSAT', 'VITEEE', 'SRMJEEE', 'COMEDK',
  'KCET', 'AP EAMCET', 'TS EAMCET', 'MHT CET', 'WBJEE', 'Other',
];

const createEmptyExam = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  exam: 'JEE Main',
  percentile: '',
  score: '',
  rank: '',
  attempt: '1',
  session: 'January',
});

const createEmptySignupData = () => ({
  personal: { fullName: '', email: '', phone: '', state: '', district: '' },
  academic: {
    board10: '',
    percentage10: '',
    board12: '',
    percentage12: '',
    physics: '',
    chemistry: '',
    mathematics: '',
    passingYear: '',
    school: '',
  },
  exams: [createEmptyExam()],
  preferences: {
    branches: [],
    states: [],
    institutionType: 'Both',
    budget: '',
    hostel: 'No preference',
    distance: 'Any distance',
    interests: '',
    careerGoals: '',
  },
  additional: { category: '' },
  password: '',
  confirmPassword: '',
  agree: false,
});

function CollegeImage({ college, className = '' }) {
  const [hasError, setHasError] = useState(false);
  const image = (
    <img
      className={className}
      src={hasError ? '/college-photo-unavailable.svg' : college.image}
      alt={hasError ? `Campus photo unavailable for ${college.name}` : college.imageSource ? `${college.name} campus photograph` : `Illustrative campus photograph, not verified as ${college.name}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );

  return college.imageSource ? (
    <a className="photo-link" href={college.imageSource} target="_blank" rel="noreferrer">
      {image}
      <span className="image-credit">Photo source · Wikimedia Commons</span>
    </a>
  ) : (
    <div className="photo-link">
      {image}
      <span className="image-credit">Illustrative photo</span>
    </div>
  );
}

function App() {
  const [sessionLoadResult] = useState(() => {
    try {
      return { session: getDemoSession(), error: '' };
    } catch (error) {
      return {
        session: null,
        error: error instanceof Error ? error.message : 'Could not load the local demo account.',
      };
    }
  });
  const [darkMode, setDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(sessionLoadResult.session));
  const [currentUser, setCurrentUser] = useState(sessionLoadResult.session);
  const [authStorageError, setAuthStorageError] = useState(sessionLoadResult.error);
  const [authMode, setAuthMode] = useState('login');
  const [signupStep, setSignupStep] = useState(0);
  const [showAuthFlow, setShowAuthFlow] = useState(false);
  const [publicView, setPublicView] = useState('home');
  const [view, setView] = useState('dashboard');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedIds, setSavedIds] = useState(sessionLoadResult.session?.profile.savedCollegeIds || []);
  const [compareIds, setCompareIds] = useState([]);
  const [profileComplete, setProfileComplete] = useState(Boolean(sessionLoadResult.session?.profile.preferences?.branches?.length));
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [collegeTypeFilter, setCollegeTypeFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [rankStateFilter, setRankStateFilter] = useState('All');
  const [rankTypeFilter, setRankTypeFilter] = useState('All');
  const [rankSort, setRankSort] = useState('rank');
  const [rankSearch, setRankSearch] = useState('');
  const [rankingVisibleCount, setRankingVisibleCount] = useState(8);
  const [loginData, setLoginData] = useState({ email: '', password: '', rememberMe: true });
  const [signupData, setSignupData] = useState(createEmptySignupData);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [accountNotice, setAccountNotice] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'This demo assistant can search the sample college list and discuss your preferences. It is not connected to an AI service, and its data is not an official source.',
    },
  ]);
  const [profileData, setProfileData] = useState(
    sessionLoadResult.session?.profile || {
      fullName: '',
      email: '',
      phone: '',
      branch: '',
      state: '',
      budget: '',
      hostel: 'No preference',
      academic: {},
      exams: [],
      preferences: {},
      category: '',
    },
  );

  const filteredColleges = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return collegeData.filter((college) => {
      const matchesQuery =
        !query ||
        college.name.toLowerCase().includes(query) ||
        college.city.toLowerCase().includes(query) ||
        college.state.toLowerCase().includes(query) ||
        (college.type && college.type.toLowerCase().includes(query));

      const matchesType = collegeTypeFilter === 'All' || college.type === collegeTypeFilter;
      const matchesBranch =
        branchFilter === 'All' ||
        (branchFilter === 'Computer Science' && (college.name.includes('IIT') || college.name.includes('NIT') || college.name.includes('IIIT') || college.name.includes('BITS')));

      return matchesQuery && matchesType && matchesBranch;
    }).sort((left, right) => left.nirf - right.nirf);
  }, [searchQuery, collegeTypeFilter, branchFilter]);

  const featuredColleges = filteredColleges.slice(0, 6);
  const rankedColleges = useMemo(() => {
    const query = rankSearch.trim().toLowerCase();
    const matches = collegeData.filter((college) => {
      const textMatches =
        !query ||
        `${college.name} ${college.city} ${college.state}`.toLowerCase().includes(query);
      return (
        textMatches &&
        (rankStateFilter === 'All' || college.state === rankStateFilter) &&
        (rankTypeFilter === 'All' || college.type === rankTypeFilter)
      );
    });

    return matches.sort((left, right) => {
      if (rankSort === 'fees') {
        return Number.parseFloat(left.fees.replace(/[^\d.]/g, '')) - Number.parseFloat(right.fees.replace(/[^\d.]/g, ''));
      }
      if (rankSort === 'package') {
        return Number.parseFloat(right.package.replace(/[^\d.]/g, '')) - Number.parseFloat(left.package.replace(/[^\d.]/g, ''));
      }
      return left.nirf - right.nirf;
    });
  }, [rankSearch, rankStateFilter, rankTypeFilter, rankSort]);

  const savedColleges = collegeData.filter((college) => savedIds.includes(college.id));

  const recommendedColleges = useMemo(() => {
    if (!profileComplete) return [];
    const preferences = profileData.preferences || {};
    const maxFee = Number(preferences.budget) || Infinity;
    return collegeData
      .map((college) => {
        const reasons = [];
        if (preferences.states?.includes(college.state)) reasons.push('matches a preferred state');
        if (preferences.institutionType === 'Both' || preferences.institutionType === college.type) reasons.push('matches institution type');
        if (Number.parseFloat(college.fees.replace(/[^\d.]/g, '')) <= maxFee) reasons.push('listed fees fall within your selected budget');
        return { ...college, reasons, eligibleByPreference: reasons.length >= 2 };
      })
      .filter((college) => college.eligibleByPreference)
      .sort((a, b) => a.nirf - b.nirf)
      .slice(0, 3);
  }, [profileComplete, profileData.preferences]);

  const getCollegeMatchesForQuery = (query = '') => {
    const normalizedQuery = query.toLowerCase();
    return [...collegeData]
      .map((college) => {
        let matches = false;
        if (normalizedQuery.includes(college.name.toLowerCase())) matches = true;
        if (college.id === 'col-4' && normalizedQuery.includes('nit trichy')) matches = true;
        if (normalizedQuery.includes('government')) matches ||= college.type === 'Government';
        if (normalizedQuery.includes('private')) matches ||= college.type === 'Private';
        if (normalizedQuery.includes('tamil')) matches ||= college.state === 'Tamil Nadu';
        if (normalizedQuery.includes('karnataka')) matches ||= college.state === 'Karnataka';
        if (normalizedQuery.includes('budget')) {
          const maxFee = Number(profileData.preferences?.budget);
          matches ||= Number.isFinite(maxFee) && Number.parseFloat(college.fees.replace(/[^\d.]/g, '')) <= maxFee;
        }
        if (normalizedQuery.includes('cs') || normalizedQuery.includes('computer')) {
          matches ||= ['IIT', 'NIT', 'IIIT', 'BITS'].some((name) => college.name.includes(name));
        }
        if (!matches && !normalizedQuery.includes('compare') && !normalizedQuery.includes('colleges')) {
          matches = `${college.name} ${college.city} ${college.state}`.toLowerCase().includes(normalizedQuery);
        }
        return { ...college, matches };
      })
      .filter((college) => college.matches)
      .sort((a, b) => a.nirf - b.nirf)
      .slice(0, 3);
  };

  const handleAssistantPrompt = (promptText) => {
    const trimmedPrompt = (promptText || '').trim();
    if (!trimmedPrompt) return;

    const suggestions = getCollegeMatchesForQuery(trimmedPrompt);
    setChatMessages((current) => [...current, { role: 'user', text: trimmedPrompt }]);
    setChatInput('');
    setChatLoading(true);
    window.setTimeout(() => {
      const names = suggestions.map((college) => college.name).join(', ');
      const normalizedPrompt = trimmedPrompt.toLowerCase();
      const answer = normalizedPrompt.includes('jee') && normalizedPrompt.includes('percentile')
        ? 'This demo does not contain verified JEE cutoffs or college-by-branch eligibility data, so it cannot assess a percentile or predict admission. Check current JoSAA and institution counselling sources.'
        : suggestions.length
        ? `From the sample college list, ${names} match that query. This is a simple local search, not an AI-generated assessment or an admission prediction. Verify current fees, rankings, and eligibility with each institution.`
        : 'I could not find a direct match in this sample list. Try a college name, state, or terms such as government, private, or budget. This demo chat is not connected to an AI service.';
      setChatMessages((current) => [...current, { role: 'assistant', text: answer }]);
      setChatLoading(false);
    }, 350);
  };

  const handleAssistantSubmit = (event) => {
    event.preventDefault();
    handleAssistantPrompt(chatInput);
  };

  const toggleSaved = (id) => {
    if (!isLoggedIn || !currentUser) {
      setAuthMode('login');
      setShowAuthFlow(true);
      setAccountNotice('Sign in to a local demo account to save colleges.');
      return;
    }

    const nextSavedIds = savedIds.includes(id)
      ? savedIds.filter((item) => item !== id)
      : [...savedIds, id];
    const updatedProfile = { ...profileData, savedCollegeIds: nextSavedIds };
    try {
      updateDemoProfile(currentUser.email, updatedProfile);
      setSavedIds(nextSavedIds);
      setProfileData(updatedProfile);
      setCurrentUser((user) => ({ ...user, profile: updatedProfile }));
    } catch (error) {
      setAuthStorageError(error instanceof Error ? error.message : 'Could not update saved colleges.');
    }
  };

  const toggleCompare = (id) => {
    setCompareIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= 3) {
        return [...current.slice(1), id];
      }
      return [...current, id];
    });
  };

  const handleForgotPassword = () => {
    const targetEmail = loginData.email;
    if (!emailRegex.test(targetEmail)) {
      setForgotMessage('Enter the email address for your local demo account. No reset email can be sent without a backend.');
      return;
    }
    setForgotMessage(`Password recovery is unavailable for ${targetEmail}: this frontend demo has no email or account recovery service.`);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    setForgotMessage('');

    if (!emailRegex.test(loginData.email)) {
      setLoginError('Please enter a valid email address.');
      return;
    }

    if (loginData.password.length < 8) {
      setLoginError('Password must be at least 8 characters long.');
      return;
    }

    setLoginLoading(true);
    try {
      const session = await loginDemoAccount(loginData);
      setCurrentUser(session);
      setProfileData(session.profile);
      setProfileComplete(Boolean(session.profile.preferences?.branches?.length));
      setSavedIds(session.profile.savedCollegeIds || []);
      setIsLoggedIn(true);
      setShowAuthFlow(false);
      setView('dashboard');
      setAccountNotice('Signed in to your local demo account.');
      setAuthStorageError('');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Could not sign in to the demo account.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setSignupError('');
    if (signupData.password.length < 8) {
      setSignupError('Password must be at least 8 characters long.');
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setSignupError('Passwords do not match. Please fix the confirmation field.');
      return;
    }

    if (!signupData.agree) {
      setSignupError('Please accept the terms and privacy policy to continue.');
      return;
    }

    const profile = {
      fullName: signupData.personal.fullName.trim(),
      email: signupData.personal.email.trim().toLowerCase(),
      phone: signupData.personal.phone.trim(),
      state: signupData.preferences.states[0] || signupData.personal.state,
      district: signupData.personal.district,
      branch: signupData.preferences.branches.join(', '),
      budget: `₹${signupData.preferences.budget}L`,
      hostel: signupData.preferences.hostel,
      academic: signupData.academic,
      exams: signupData.exams,
      preferences: signupData.preferences,
      category: signupData.additional.category,
      savedCollegeIds: [],
    };
    setSignupLoading(true);
    try {
      const session = await registerDemoAccount({
        email: profile.email,
        password: signupData.password,
        profile,
        rememberMe: true,
      });
      setCurrentUser(session);
      setProfileData(profile);
      setSavedIds([]);
      setProfileComplete(true);
      setIsLoggedIn(true);
      setShowAuthFlow(false);
      setSignupData(createEmptySignupData());
      setSignupStep(0);
      setView('dashboard');
      setAccountNotice('Demo account created on this device. No backend is connected.');
      setAuthStorageError('');
    } catch (error) {
      setSignupError(error instanceof Error ? error.message : 'Could not save your demo account.');
    } finally {
      setSignupLoading(false);
    }
  };

  const updateSignupSection = (section, field, value) => {
    setSignupData((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
  };

  const updateSignupExam = (id, field, value) => {
    setSignupData((current) => ({
      ...current,
      exams: current.exams.map((exam) => (exam.id === id ? { ...exam, [field]: value } : exam)),
    }));
  };

  const validateSignupStep = () => {
    const { personal, academic, preferences } = signupData;
    if (signupStep === 0) {
      if (!personal.fullName.trim()) return 'Enter your full name.';
      if (!emailRegex.test(personal.email)) return 'Enter a valid email address.';
      if (personal.phone.replace(/\D/g, '').length < 10) return 'Enter a phone number with at least 10 digits.';
      if (!personal.state) return 'Select your home state.';
      if (signupData.password.length < 8) return 'Password must be at least 8 characters long.';
      if (signupData.password !== signupData.confirmPassword) return 'Passwords do not match.';
    }
    if (signupStep === 1) {
      if (!academic.board10 || !academic.board12 || !academic.percentage10 || !academic.percentage12 || !academic.passingYear) {
        return 'Enter your Class 10 and 12 board, percentage, and Class 12 passing year.';
      }
      const percentages = [
        academic.percentage10,
        academic.percentage12,
        academic.physics,
        academic.chemistry,
        academic.mathematics,
      ].filter(Boolean);
      if (percentages.some((value) => !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
        return 'Marks and percentages must be numbers between 0 and 100.';
      }
    }
    if (signupStep === 3 && (!preferences.branches.length || !preferences.budget)) {
      return 'Select at least one preferred branch and your maximum annual fees.';
    }
    if (signupStep === 5 && !signupData.agree) {
      return 'Accept the demo account notice to continue.';
    }
    return '';
  };

  const handleSignupNext = () => {
    const error = validateSignupStep();
    if (error) {
      setSignupError(error);
      return;
    }
    setSignupError('');
    setSignupStep((step) => Math.min(step + 1, 5));
  };

  const toggleSignupPreference = (field, value) => {
    setSignupData((current) => {
      const values = current.preferences[field];
      return {
        ...current,
        preferences: {
          ...current.preferences,
          [field]: values.includes(value)
            ? values.filter((item) => item !== value)
            : [...values, value],
        },
      };
    });
  };

  const completeProfile = () => {
    if (!profileData.preferences?.branches?.length || !profileData.preferences?.budget) {
      setAuthStorageError('Choose at least one preferred branch and a maximum annual fee before saving your profile.');
      return;
    }

    try {
      const updatedProfile = {
        ...profileData,
        branch: profileData.preferences?.branches?.join(', ') || profileData.branch,
        state: profileData.preferences?.states?.[0] || profileData.state,
        budget: profileData.preferences?.budget ? `₹${profileData.preferences.budget}L` : profileData.budget,
        hostel: profileData.preferences?.hostel || profileData.hostel,
      };
      updateDemoProfile(currentUser.email, updatedProfile);
      setProfileData(updatedProfile);
      setCurrentUser((user) => ({ ...user, profile: updatedProfile }));
      setProfileComplete(Boolean(updatedProfile.preferences?.branches?.length));
      setShowProfileWizard(false);
      setAuthStorageError('');
    } catch (error) {
      setAuthStorageError(error instanceof Error ? error.message : 'Could not save your profile changes.');
    }
  };

  const updateProfilePreference = (field, value) => {
    setProfileData((current) => ({
      ...current,
      preferences: { ...current.preferences, [field]: value },
    }));
  };

  const toggleProfilePreference = (field, value) => {
    setProfileData((current) => {
      const values = current.preferences?.[field] || [];
      return {
        ...current,
        preferences: {
          ...current.preferences,
          [field]: values.includes(value)
            ? values.filter((item) => item !== value)
            : [...values, value],
        },
      };
    });
  };

  const updateAcademicProfile = (field, value) => {
    setProfileData((current) => ({
      ...current,
      academic: { ...current.academic, [field]: value },
    }));
  };

  const updateProfileExam = (id, field, value) => {
    setProfileData((current) => ({
      ...current,
      exams: current.exams.map((exam) => (exam.id === id ? { ...exam, [field]: value } : exam)),
    }));
  };

  const logout = () => {
    logoutDemoAccount();
    setCurrentUser(null);
    setProfileData({
      fullName: '', email: '', phone: '', branch: '', state: '', budget: '',
      hostel: 'No preference', academic: {}, exams: [], preferences: {}, category: '',
    });
    setProfileComplete(false);
    setIsLoggedIn(false);
    setView('dashboard');
    setPublicView('home');
  };

  const navItems = [
    { label: 'Home', value: 'dashboard' },
    { label: 'Recommendations', value: 'recommendations' },
    { label: 'Rankings', value: 'rankings' },
    { label: 'Saved', value: 'saved' },
    { label: 'AI chat', value: 'assistant' },
    { label: 'Profile', value: 'profile' },
    { label: 'Compare', value: 'compare' },
  ];

  const publicNavItems = [
    { label: 'Home', value: 'home' },
    { label: 'Explore Colleges', value: 'explore' },
    { label: 'NIRF Rankings', value: 'rankings' },
    { label: 'AI Chat', value: 'assistant' },
    { label: 'About', value: 'about' },
  ];

  const renderPublicHome = () => (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={14} /> College discovery
          </span>
          <h1>Find the Engineering College That Fits Your Future</h1>
          <p>
            Explore India&apos;s leading engineering colleges, compare opportunities, and discover colleges that match your academic profile, interests, and career goals.
          </p>
          <div className="hero-search">
            <Search size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search colleges, cities, or states"
            />
          </div>
          <div className="row-actions">
            <button className="primary-btn" type="button" onClick={() => document.getElementById('featured-colleges')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Top Colleges
            </button>
            <button className="secondary-btn" type="button" onClick={() => { setAuthMode('login'); setShowAuthFlow(true); }}>
              Get Personalized Recommendations
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-image" />
          <div className="mini-stat one">
            <TrendingUp size={18} />
            <div>
              <strong>Sample</strong>
              <span>college data</span>
            </div>
          </div>
          <div className="mini-stat two">
            <GraduationCap size={18} />
            <div>
              <strong>{collegeData.length}</strong>
              <span>sample colleges</span>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-grid">
        {quickActions.map(({ label, icon: Icon, target }) => (
          <button className="quick-card" key={label} type="button" onClick={() => {
            if (target === 'recommendations') {
              setAuthMode('login');
              setShowAuthFlow(true);
              return;
            }
            if (target === 'assistant') {
              setPublicView('assistant');
              return;
            }
            if (target === 'rankings') {
              setPublicView('rankings');
              return;
            }
            if (target === 'profile' || target === 'saved' || target === 'compare') {
              setAuthMode('login');
              setShowAuthFlow(true);
              setAccountNotice(`${label} is available after you create a local demo account or sign in.`);
              return;
            }
            setPublicView('explore');
          }}>
            <span className="icon-wrap">
              <Icon size={18} />
            </span>
            <strong>{label}</strong>
            <ChevronRight size={16} />
          </button>
        ))}
      </section>

      <section className="section-header">
        <div>
          <p className="section-kicker">Featured colleges</p>
          <h2>Explore India&apos;s Top Engineering Colleges</h2>
          <p className="section-description">
            Discover leading institutions, compare essential information, and take the next step towards your engineering career.
          </p>
        </div>
        <button className="text-link" type="button" onClick={() => setPublicView('rankings')}>
          View All Colleges
        </button>
      </section>

      <p className="data-disclaimer">
        College details, rankings, fees, and outcome figures below are sample data, not verified current official records.
        Commons photo source pages are linked where available; other campus images are generic illustrations, not verified views of the named institutions.
      </p>
      <div className="college-grid" id="featured-colleges">
        {featuredColleges.map((college) => (
          <article className="college-card" key={college.id}>
            <div className="college-image-wrap">
              <CollegeImage college={college} />
              <button type="button" className="save-button" onClick={() => toggleSaved(college.id)}>
                <Bookmark size={16} fill={savedIds.includes(college.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="college-body">
              <div className="college-head">
                <div>
                  <h3>{college.name}</h3>
                  <p>
                    <MapPin size={14} /> {college.city}, {college.state}
                  </p>
                </div>
                <span className="rank-badge"># {college.nirf}</span>
              </div>

              <div className="stats-row">
                <span>{college.type}</span>
                <span>Fees: {college.fees}</span>
                <span>Placement: {college.placement}</span>
              </div>

              <div className="meta-row">
                <div>
                  <small>Average package</small>
                  <strong>{college.package}</strong>
                </div>
                <div>
                  <small>Rank reference</small>
                  <strong>Unverified</strong>
                </div>
              </div>

              <div className="card-actions">
                <button className="secondary-btn small" type="button" onClick={() => setSelectedCollege(college)}>
                  View details
                </button>
                <button className="primary-btn small" type="button" onClick={() => toggleSaved(college.id)}>
                  {savedIds.includes(college.id) ? 'Saved' : 'Save college'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );

  const renderPublicExplore = () => (
    <div className="page-panel">
      <div className="section-header compact">
        <div>
          <p className="section-kicker">Discovery</p>
          <h2>Explore colleges by your priorities</h2>
        </div>
      </div>

      <div className="filter-bar">
        <div className="hero-search compact-search">
          <Search size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search colleges, cities, or states"
          />
        </div>
        <select className="filter-select" value={collegeTypeFilter} onChange={(event) => setCollegeTypeFilter(event.target.value)}>
          <option value="All">All institutions</option>
          <option value="Government">Government</option>
          <option value="Private">Private</option>
        </select>
        <select className="filter-select" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
          <option value="All">All branches</option>
          <option value="Computer Science">Computer Science</option>
          <option value="AI & Data Science">AI & Data Science</option>
        </select>
      </div>

      <div className="college-grid compact-grid">
        {filteredColleges.map((college) => (
          <article className="college-card" key={college.id}>
            <div className="college-image-wrap">
              <CollegeImage college={college} />
            </div>
            <div className="college-body">
              <div className="college-head">
                <div>
                  <h3>{college.name}</h3>
                  <p>
                    <MapPin size={14} /> {college.city}, {college.state}
                  </p>
                </div>
                <span className="rank-badge"># {college.nirf}</span>
              </div>
              <div className="stats-row">
                <span>{college.type}</span>
                <span>{college.package}</span>
                <span>{college.placement}</span>
              </div>
              <div className="card-actions">
                <button className="secondary-btn small" type="button" onClick={() => setSelectedCollege(college)}>
                  View details
                </button>
                <button className="primary-btn small" type="button" onClick={() => toggleSaved(college.id)}>
                  {savedIds.includes(college.id) ? 'Saved' : 'Save'}
                </button>
              </div>
              <div className="compare-row">
                <button className="text-link" type="button" onClick={() => toggleCompare(college.id)}>
                  {compareIds.includes(college.id) ? 'Remove' : 'Compare'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );

  const renderPublicAbout = () => (
    <div className="page-panel">
      <div className="section-header compact">
        <div>
          <p className="section-kicker">About</p>
          <h2>Helping students choose the right engineering path</h2>
        </div>
      </div>
      <div className="about-grid">
        <div className="trust-item">
          <ShieldCheck size={18} />
          <div>
            <strong>Career-focused discovery</strong>
            <p>Compare colleges based on outcomes, budget, and fit rather than just brand name.</p>
          </div>
        </div>
        <div className="trust-item">
          <TrendingUp size={18} />
          <div>
            <strong>Data-driven recommendations</strong>
            <p>Use rankings, fees, and placement outcomes to shortlist colleges with the strongest fit.</p>
          </div>
        </div>
        <div className="trust-item">
          <MapPin size={18} />
          <div>
            <strong>Built for Indian students</strong>
            <p>Explore institutions across states and programs while weighing location, budget, and career goals.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={14} /> College discovery
          </span>
          <h1>Your future starts with the right college.</h1>
          <p>
            CollegeGuide AI helps students explore engineering colleges, compare outcomes, and shortlist programs that fit their academic goals.
          </p>
          <div className="hero-search">
            <Search size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search colleges, cities, or states"
            />
          </div>
          <div className="row-actions">
            <button className="primary-btn" type="button" onClick={() => setView('dashboard')}>
              Find My Colleges
            </button>
            <button className="secondary-btn" type="button" onClick={() => setView('rankings')}>
              Explore Rankings
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-image" />
          <div className="mini-stat one">
            <TrendingUp size={18} />
            <div>
              <strong>Sample</strong>
              <span>placement figures</span>
            </div>
          </div>
          <div className="mini-stat two">
            <GraduationCap size={18} />
            <div>
              <strong>{collegeData.length}</strong>
              <span>sample colleges</span>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-grid">
        {quickActions.map(({ label, icon: Icon, target }) => (
          <button className="quick-card" key={label} type="button" onClick={() => setView(target)}>
            <span className="icon-wrap">
              <Icon size={18} />
            </span>
            <strong>{label}</strong>
            <ChevronRight size={16} />
          </button>
        ))}
      </section>

      <section className="section-header">
        <div>
          <p className="section-kicker">Featured colleges</p>
          <h2>Engineering colleges you should shortlist</h2>
        </div>
        <button className="text-link" type="button" onClick={() => setView('rankings')}>
          View all colleges
        </button>
      </section>

      {compareIds.length ? (
        <div className="compare-banner">
          <div>
            <p className="section-kicker">Compare shortlist</p>
            <h3>{compareIds.length} colleges selected</h3>
          </div>
          <button type="button" className="primary-btn small" onClick={() => setView('compare')}>
            Compare now
          </button>
        </div>
      ) : null}

      <div className="college-grid">
        {featuredColleges.map((college) => (
          <article className="college-card" key={college.id}>
            <div className="college-image-wrap">
              <CollegeImage college={college} />
              <button type="button" className="save-button" onClick={() => toggleSaved(college.id)}>
                <Bookmark size={16} fill={savedIds.includes(college.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="college-body">
              <div className="college-head">
                <div>
                  <h3>{college.name}</h3>
                  <p>
                    <MapPin size={14} /> {college.city}, {college.state}
                  </p>
                </div>
                <span className="rank-badge"># {college.nirf}</span>
              </div>

              <div className="stats-row">
                <span>{college.type}</span>
                <span>Fees: {college.fees}</span>
                <span>Placement: {college.placement}</span>
              </div>

              <div className="meta-row">
                <div>
                  <small>Average package</small>
                  <strong>{college.package}</strong>
                </div>
                <div>
                  <small>Rank reference</small>
                  <strong>Unverified</strong>
                </div>
              </div>

              <div className="card-actions">
                <button className="secondary-btn small" type="button" onClick={() => setSelectedCollege(college)}>
                  View details
                </button>
                <button className="primary-btn small" type="button" onClick={() => toggleSaved(college.id)}>
                  {savedIds.includes(college.id) ? 'Saved' : 'Save college'}
                </button>
              </div>
              <div className="compare-row">
                <button className="text-link" type="button" onClick={() => toggleCompare(college.id)}>
                  {compareIds.includes(college.id) ? 'Remove from compare' : 'Add to compare'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="recommendations-block">
        {profileComplete ? (
          <>
            <div className="section-header compact">
              <div>
                <p className="section-kicker">Recommended for you</p>
                <h2>Based on your profile and preferences</h2>
              </div>
              <button className="text-link" type="button" onClick={() => setShowProfileWizard(true)}>
                Update preferences
              </button>
            </div>
            <div className="recommendation-grid">
              {recommendedColleges.map((college) => (
                <div className="recommendation-card" key={college.id}>
                  <div className="mini-badge">Top match</div>
                  <h3>{college.name}</h3>
                  <p>
                    <MapPin size={14} /> {college.city}, {college.state}
                  </p>
                  <ul>
                    <li>{college.type}</li>
                    <li>{college.package} average package</li>
                    <li>{college.placement} placement rate</li>
                  </ul>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="onboarding-card">
            <div className="onboarding-copy">
              <span className="eyebrow light">
                <Sparkles size={14} /> Personalization unlocked
              </span>
              <h3>Complete your profile for smarter recommendations.</h3>
              <p>
                Personalized suggestions help you match colleges based on your branch, budget, and preferred states.
              </p>
              <button type="button" className="primary-btn" onClick={() => setShowProfileWizard(true)}>
                Complete Your Profile
              </button>
            </div>
            <div className="onboarding-visual">
              <div className="pulse-box">
                <Check size={26} />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="discovery-wrap">
        <div className="section-header compact">
          <div>
            <p className="section-kicker">Discovery</p>
            <h2>Explore by what matters most</h2>
          </div>
        </div>
        <div className="discovery-grid">
          {discoveryCards.map((card) => (
            <button className="discovery-card" key={card.label} type="button" onClick={() => setView('rankings')}>
              <span>{card.label}</span>
              <strong>{card.emphasis}</strong>
              <small>{card.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="trust-box">
        <div>
          <p className="section-kicker">What we do</p>
          <h2>Designed to help students make better admission decisions.</h2>
        </div>
        <div className="trust-grid">
          <div className="trust-item">
            <ShieldCheck size={18} />
            <div>
              <strong>Transparent sample data</strong>
              <p>College rankings, fees, and placement figures in this prototype are illustrative sample content, not verified official data.</p>
            </div>
          </div>
          <div className="trust-item">
            <Wallet size={18} />
            <div>
              <strong>Budget-aware</strong>
              <p>Filter by tuition, placement outcomes, and preferred study locations before shortlisting.</p>
            </div>
          </div>
          <div className="trust-item">
            <MapPin size={18} />
            <div>
              <strong>Location-first discovery</strong>
              <p>Compare colleges by state, cost, and choosing the right campus culture for your goals.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const renderRankings = () => (
    <div className="page-panel">
      <div className="section-header compact">
        <div>
          <p className="section-kicker">College rankings</p>
          <h2>Explore engineering colleges</h2>
          <p className="section-description">
            Ranking year is unverified. These sample rank numbers and college metrics are for interface demonstration only.
          </p>
        </div>
        <span className="plain-pill">Sample data · year unverified</span>
      </div>
      <div className="filter-bar ranking-filters">
        <div className="hero-search compact-search">
          <Search size={18} />
          <input
            type="search"
            aria-label="Search colleges, cities, or states"
            placeholder="Search colleges, cities, or states"
            value={rankSearch}
            onChange={(event) => {
              setRankSearch(event.target.value);
              setRankingVisibleCount(8);
            }}
          />
        </div>
        <select className="filter-select" aria-label="Filter by state" value={rankStateFilter} onChange={(event) => { setRankStateFilter(event.target.value); setRankingVisibleCount(8); }}>
          <option value="All">All states</option>
          {stateOptions.map((state) => <option key={state} value={state}>{state}</option>)}
        </select>
        <select className="filter-select" aria-label="Filter by institution type" value={rankTypeFilter} onChange={(event) => { setRankTypeFilter(event.target.value); setRankingVisibleCount(8); }}>
          <option value="All">Government and private</option>
          <option value="Government">Government</option>
          <option value="Private">Private</option>
        </select>
        <select className="filter-select" aria-label="Sort colleges" value={rankSort} onChange={(event) => setRankSort(event.target.value)}>
          <option value="rank">Sort by sample rank</option>
          <option value="fees">Sort by sample fees</option>
          <option value="package">Sort by sample average package</option>
        </select>
      </div>
      <p className="data-disclaimer">
        Commons photo source pages are linked where available; other campus images are generic illustrations. The ranking year is not verified. Please check official sources before making decisions.
      </p>
      <div className="ranking-list">
        {rankedColleges.slice(0, rankingVisibleCount).map((college) => (
          <div className="ranking-row" key={college.id}>
            <div className="rank-index">#{college.nirf}</div>
            <div className="rank-school">
              <strong>{college.name}</strong>
              <span>
                {college.city}, {college.state}
              </span>
            </div>
            <div className="rank-type">{college.type}</div>
            <div className="rank-metric">Fees: {college.fees}</div>
            <div className="rank-metric">Placement: {college.placement}</div>
            <div className="ranking-actions">
              <button className="text-link" type="button" onClick={() => setSelectedCollege(college)}>View details</button>
              <button className="text-link" type="button" onClick={() => toggleSaved(college.id)}>
                {savedIds.includes(college.id) ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        ))}
        {!rankedColleges.length ? <div className="empty-state">No sample colleges match these filters.</div> : null}
      </div>
      {rankingVisibleCount < rankedColleges.length ? (
        <button className="secondary-btn load-more-btn" type="button" onClick={() => setRankingVisibleCount((count) => count + 8)}>
          Load more colleges
        </button>
      ) : null}
    </div>
  );

  const renderSaved = () => (
    <div className="page-panel">
      <div className="section-header compact">
        <div>
          <p className="section-kicker">Saved</p>
          <h2>Your shortlisted colleges</h2>
        </div>
      </div>
      {savedColleges.length ? (
        <div className="college-grid compact-grid">
          {savedColleges.map((college) => (
            <article className="college-card" key={college.id}>
              <div className="college-image-wrap">
                <CollegeImage college={college} />
              </div>
              <div className="college-body">
                <h3>{college.name}</h3>
                <p>
                  <MapPin size={14} /> {college.city}, {college.state}
                </p>
                <div className="stats-row">
                  <span>{college.type}</span>
                  <span>{college.package}</span>
                </div>
                <div className="card-actions">
                  <button className="secondary-btn small" type="button" onClick={() => setSelectedCollege(college)}>
                    View details
                  </button>
                  <button className="primary-btn small" type="button" onClick={() => toggleCompare(college.id)}>
                    {compareIds.includes(college.id) ? 'Remove compare' : 'Compare'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">No colleges saved yet. Shortlist a few and come back here.</div>
      )}
    </div>
  );

  const renderAssistant = () => (
    <div className="page-panel assistant-panel">
      <div className="section-header compact">
        <div>
          <p className="section-kicker">CollegeGuide demo assistant</p>
          <h2>Explore the sample college list</h2>
        </div>
      </div>
      <p className="data-disclaimer">
        This is a local demonstration, not an AI service. Responses are simple searches over unverified sample data; admission eligibility and cutoffs are not calculated.
      </p>

      <div className="prompt-list">
        <button type="button" onClick={() => handleAssistantPrompt('Which colleges fit my budget?')}>Which colleges fit my budget?</button>
        <button type="button" onClick={() => handleAssistantPrompt('Show top government colleges')}>Show top government colleges</button>
        <button type="button" onClick={() => handleAssistantPrompt('Compare IIT Madras and NIT Trichy')}>Compare IIT Madras and NIT Trichy</button>
        <button type="button" onClick={() => handleAssistantPrompt('Which colleges match my JEE percentile?')}>Which colleges match my JEE percentile?</button>
      </div>

      <div className="chat-box">
        {chatMessages.map((message, index) => (
          <div className={`chat-bubble ${message.role}`} key={`${message.role}-${index}`}>
            <strong>{message.role === 'assistant' ? 'Demo assistant' : 'You'}</strong>
            <p>{message.text}</p>
          </div>
        ))}
        {chatLoading ? (
          <div className="chat-bubble assistant" role="status" aria-live="polite">
            <strong>Demo assistant</strong>
            <p>Searching the sample college list…</p>
          </div>
        ) : null}
      </div>

      <form className="chat-form" onSubmit={handleAssistantSubmit}>
        <input
          type="text"
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          placeholder="Search by college, state, or institution type..."
        />
        <button type="submit" className="primary-btn small" disabled={chatLoading || !chatInput.trim()}>Search</button>
      </form>
    </div>
  );

  const renderRecommendations = () => (
    <div className="page-panel">
      <div className="section-header compact">
        <div>
          <p className="section-kicker">Personalized shortlist · demo</p>
          <h2>College options based on your preferences</h2>
        </div>
        <button className="text-link" type="button" onClick={() => setShowProfileWizard(true)}>Edit preferences</button>
      </div>
      <p className="data-disclaimer">
        This transparent demo filters sample records by your budget, selected states, and institution type. It does not use exam scores to predict admission eligibility; program availability, cutoffs, and current fees require verified data.
      </p>
      {recommendedColleges.length ? (
        <div className="college-grid compact-grid">
          {recommendedColleges.map((college) => (
            <article className="college-card" key={college.id}>
              <div className="college-image-wrap"><CollegeImage college={college} /></div>
              <div className="college-body">
                <div className="college-head">
                  <div><h3>{college.name}</h3><p><MapPin size={14} /> {college.city}, {college.state}</p></div>
                  <span className="rank-badge">Sample #{college.nirf}</span>
                </div>
                <div className="stats-row"><span>{college.type}</span><span>Sample fees: {college.fees}</span></div>
                <ul className="match-reasons">{college.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                <p className="form-note">No admission probability or eligibility score is available.</p>
                <button className="secondary-btn small" type="button" onClick={() => setSelectedCollege(college)}>View details</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          No sample college meets at least two of your current filters. Update your preferences to see a broader shortlist.
          <button className="secondary-btn small" type="button" onClick={() => setShowProfileWizard(true)}>Update preferences</button>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="page-panel">
      <div className="section-header compact">
        <div>
          <p className="section-kicker">Student profile</p>
          <h2>{profileComplete ? 'Your profile is ready' : 'Complete your student profile'}</h2>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-avatar">{profileData.fullName.charAt(0).toUpperCase()}</div>
          <h3>{profileData.fullName}</h3>
          <p>{profileData.email}</p>
          <p>{profileData.phone}</p>
          <p>{profileData.branch || 'No preferred branches added'}</p>
        </div>

        <div className="profile-card detail-card">
          <div className="detail-row">
            <span>Preferred states</span>
            <strong>{profileData.preferences?.states?.join(', ') || profileData.state || 'Not set'}</strong>
          </div>
          <div className="detail-row">
            <span>Maximum annual fees</span>
            <strong>{profileData.preferences?.budget ? `₹${profileData.preferences.budget}L` : profileData.budget || 'Not set'}</strong>
          </div>
          <div className="detail-row">
            <span>Institution type</span>
            <strong>{profileData.preferences?.institutionType || 'Not set'}</strong>
          </div>
          <div className="detail-row">
            <span>Hostel preference</span>
            <strong>{profileData.preferences?.hostel || profileData.hostel || 'Not set'}</strong>
          </div>
          <button type="button" className="primary-btn small" onClick={() => setShowProfileWizard(true)}>
            {profileComplete ? 'Update profile' : 'Complete profile'}
          </button>
          <button type="button" className="secondary-btn small" onClick={logout}>Log out</button>
        </div>
      </div>
      <section className="profile-detail-section">
        <h3>Academic information</h3>
        <div className="profile-card">
          <p>Class 10: {profileData.academic?.board10 || 'Not provided'}{profileData.academic?.percentage10 ? ` · ${profileData.academic.percentage10}%` : ''}</p>
          <p>Class 12: {profileData.academic?.board12 || 'Not provided'}{profileData.academic?.percentage12 ? ` · ${profileData.academic.percentage12}%` : ''}</p>
          <p>Physics / Chemistry / Mathematics: {[profileData.academic?.physics, profileData.academic?.chemistry, profileData.academic?.mathematics].map((value) => value ? `${value}%` : '—').join(' / ')}</p>
          <p>Passing year: {profileData.academic?.passingYear || 'Not provided'} · School: {profileData.academic?.school || 'Not provided'}</p>
        </div>
      </section>
      <section className="profile-detail-section">
        <h3>Entrance exam results</h3>
        {profileData.exams?.length ? profileData.exams.map((exam) => (
          <div className="profile-card exam-summary" key={exam.id}>
            <strong>{exam.exam}</strong>
            <span>{exam.percentile ? `Percentile ${exam.percentile}` : 'Percentile not entered'}</span>
            <span>{exam.score ? `Score ${exam.score}` : 'Score not entered'}</span>
            <span>{exam.rank ? `Rank ${exam.rank}` : 'Rank not entered'}</span>
          </div>
        )) : <p className="form-note">No exam results entered.</p>}
      </section>
      <section className="profile-detail-section">
        <h3>College preferences</h3>
        <div className="profile-card">
          <p>Branches: {profileData.preferences?.branches?.join(', ') || 'Not set'}</p>
          <p>Interests: {profileData.preferences?.interests || 'Not provided'} · Career goals: {profileData.preferences?.careerGoals || 'Not provided'}</p>
          <p>Saved colleges: {savedIds.length}</p>
          <p>Additional category information: {profileData.category || 'Not provided'}</p>
        </div>
      </section>
    </div>
  );

  const compareColleges = collegeData.filter((college) => compareIds.includes(college.id));

  const renderCompare = () => (
    <div className="page-panel">
      <div className="section-header compact">
        <div>
          <p className="section-kicker">Compare</p>
          <h2>College comparison snapshot</h2>
        </div>
      </div>
      {compareColleges.length ? (
        <div className="comparison-table">
          <div className="comparison-head">
            <span>College</span>
            <span>Type</span>
            <span>Fees</span>
            <span>Package</span>
            <span>Placement</span>
          </div>
          {compareColleges.map((college) => (
            <div className="comparison-row" key={college.id}>
              <span>{college.name}</span>
              <span>{college.type}</span>
              <span>{college.fees}</span>
              <span>{college.package}</span>
              <span>{college.placement}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">Select at least one college to compare. You can add colleges from cards or saved shortlists.</div>
      )}
    </div>
  );

  const mainContent =
    view === 'dashboard'
      ? renderDashboard()
      : view === 'rankings'
        ? renderRankings()
      : view === 'recommendations'
        ? renderRecommendations()
      : view === 'saved'
          ? renderSaved()
          : view === 'assistant'
            ? renderAssistant()
            : view === 'profile'
              ? renderProfile()
              : renderCompare();

  const publicMainContent =
    publicView === 'explore'
      ? renderPublicExplore()
      : publicView === 'rankings'
        ? renderRankings()
        : publicView === 'assistant'
          ? renderAssistant()
          : publicView === 'about'
            ? renderPublicAbout()
            : renderPublicHome();

  return (
    <div className={`app-shell ${darkMode ? 'dark' : ''}`}>
      {!isLoggedIn ? (
        showAuthFlow ? (
          <div className="auth-shell">
            <div className="theme-toggle top-right">
              <button type="button" aria-label={darkMode ? 'Use light theme' : 'Use dark theme'} onClick={() => setDarkMode((current) => !current)}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            <div className="auth-layout">
              <aside className="brand-panel">
                <div className="brand-row">
                  <div className="brand-mark">
                    <GraduationCap size={20} />
                  </div>
                  <span>CollegeGuide AI</span>
                </div>
                <button type="button" className="text-link auth-home-link" onClick={() => { setShowAuthFlow(false); setAuthMode('login'); setLoginError(''); }}>
                  <ArrowRight size={14} /> Return to homepage
                </button>

                <div className="brand-copy">
                  <h1>Find the college that fits your future.</h1>
                  <p>
                    Discover colleges, compare outcomes, and shortlist the right engineering program with insight-driven guidance.
                  </p>
                </div>

                <div className="campus-image" />

                <div className="benefit-list">
                  <div>
                    <Check size={16} />
                    <span>Personalized recommendations</span>
                  </div>
                  <div>
                    <Check size={16} />
                    <span>College comparisons</span>
                  </div>
                  <div>
                    <Check size={16} />
                    <span>Admission insights</span>
                  </div>
                </div>
              </aside>

              <section className="auth-panel">
                {authMode === 'login' ? (
                  <form className="auth-card" onSubmit={handleLogin}>
                    <div className="auth-header-block">
                      <div className="brand-mark compact">
                        <GraduationCap size={18} />
                      </div>
                      <h2>Welcome back</h2>
                      <p>Sign in to your local demo account. New visitors can continue browsing without an account.</p>
                    </div>
                    {authStorageError ? <p className="status-message error" role="alert">{authStorageError}</p> : null}
                    {accountNotice ? <p className="status-message info" role="status">{accountNotice}</p> : null}

                    <label className="field-group">
                      <span>Email address</span>
                      <div className="input-wrap">
                        <Mail size={16} />
                        <input
                          type="email"
                          autoComplete="email"
                          value={loginData.email}
                          onChange={(event) => setLoginData({ ...loginData, email: event.target.value })}
                          placeholder="you@example.com"
                        />
                      </div>
                    </label>

                    <label className="field-group">
                      <span>Password</span>
                      <div className="input-wrap">
                        <Lock size={16} />
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={loginData.password}
                          onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
                          placeholder="Enter your password"
                        />
                        <button type="button" className="password-toggle" onClick={() => setShowLoginPassword((current) => !current)}>
                          {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </label>

                    <div className="meta-row">
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={loginData.rememberMe}
                          onChange={(event) => setLoginData({ ...loginData, rememberMe: event.target.checked })}
                        />
                        <span>Remember me</span>
                      </label>
                      <button type="button" className="inline-link" onClick={handleForgotPassword}>
                        Forgot password?
                      </button>
                    </div>

                    {forgotMessage ? <p className="status-message info">{forgotMessage}</p> : null}
                    {loginError ? <p className="status-message error">{loginError}</p> : null}

                    <button className="primary-btn full-width" type="submit" disabled={loginLoading}>
                      {loginLoading ? 'Signing in...' : 'Log in'}
                      <ArrowRight size={16} />
                    </button>

                    <div className="auth-footer">
                      <span>Don&apos;t have an account?</span>
                      <button type="button" className="inline-link" onClick={() => { setAuthMode('signup'); setForgotMessage(''); }}>
                        Sign up
                      </button>
                    </div>
                  </form>
                ) : (
                  <form className="auth-card signup-card signup-wizard" onSubmit={signupStep === 5 ? handleSignup : (event) => { event.preventDefault(); handleSignupNext(); }}>
                    <div className="auth-header-block">
                      <div className="brand-mark compact"><GraduationCap size={18} /></div>
                      <h2>Create your account</h2>
                      <p>Step {signupStep + 1} of 6 · Your profile stays on this device in demo mode.</p>
                    </div>
                    <div className="signup-progress" aria-label={`Registration step ${signupStep + 1} of 6`}>
                      {['Personal', 'Academics', 'Exams', 'Preferences', 'Additional', 'Review'].map((label, index) => (
                        <button
                          type="button"
                          key={label}
                          className={index === signupStep ? 'signup-step active' : index < signupStep ? 'signup-step complete' : 'signup-step'}
                          onClick={() => {
                            if (index < signupStep) setSignupStep(index);
                          }}
                          aria-current={index === signupStep ? 'step' : undefined}
                        >
                          <span>{index + 1}</span>{label}
                        </button>
                      ))}
                    </div>

                    {signupStep === 0 ? (
                      <div className="signup-fields">
                        <label className="field-group"><span>Full name</span><input className="wizard-input" required value={signupData.personal.fullName} onChange={(event) => updateSignupSection('personal', 'fullName', event.target.value)} /></label>
                        <label className="field-group"><span>Email address</span><input className="wizard-input" type="email" required autoComplete="email" value={signupData.personal.email} onChange={(event) => updateSignupSection('personal', 'email', event.target.value)} /></label>
                        <label className="field-group"><span>Phone number</span><input className="wizard-input" type="tel" required value={signupData.personal.phone} onChange={(event) => updateSignupSection('personal', 'phone', event.target.value)} placeholder="+91 98765 43210" /></label>
                        <label className="field-group"><span>Home state</span><select className="wizard-input" required value={signupData.personal.state} onChange={(event) => updateSignupSection('personal', 'state', event.target.value)}><option value="">Select a state</option>{stateOptions.map((state) => <option key={state}>{state}</option>)}</select></label>
                        <label className="field-group"><span>District</span><input className="wizard-input" value={signupData.personal.district} onChange={(event) => updateSignupSection('personal', 'district', event.target.value)} /></label>
                        <label className="field-group"><span>Password (8+ characters)</span><div className="input-wrap"><Lock size={16} /><input className="wizard-input with-icon" type={showSignupPassword ? 'text' : 'password'} required autoComplete="new-password" value={signupData.password} onChange={(event) => setSignupData((current) => ({ ...current, password: event.target.value }))} /><button type="button" className="password-toggle" aria-label={showSignupPassword ? 'Hide password' : 'Show password'} onClick={() => setShowSignupPassword((current) => !current)}>{showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
                        <label className="field-group"><span>Confirm password</span><div className="input-wrap"><Lock size={16} /><input className="wizard-input with-icon" type={showSignupConfirm ? 'text' : 'password'} required autoComplete="new-password" value={signupData.confirmPassword} onChange={(event) => setSignupData((current) => ({ ...current, confirmPassword: event.target.value }))} /><button type="button" className="password-toggle" aria-label={showSignupConfirm ? 'Hide password' : 'Show password'} onClick={() => setShowSignupConfirm((current) => !current)}>{showSignupConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
                      </div>
                    ) : null}

                    {signupStep === 1 ? (
                      <div className="signup-fields">
                        <label className="field-group"><span>Class 10 board</span><input className="wizard-input" required value={signupData.academic.board10} onChange={(event) => updateSignupSection('academic', 'board10', event.target.value)} placeholder="CBSE, ICSE, State board..." /></label>
                        <label className="field-group"><span>Class 10 percentage</span><input className="wizard-input" required type="number" min="0" max="100" step="0.01" value={signupData.academic.percentage10} onChange={(event) => updateSignupSection('academic', 'percentage10', event.target.value)} /></label>
                        <label className="field-group"><span>Class 12 board</span><input className="wizard-input" required value={signupData.academic.board12} onChange={(event) => updateSignupSection('academic', 'board12', event.target.value)} placeholder="CBSE, ICSE, State board..." /></label>
                        <label className="field-group"><span>Class 12 percentage</span><input className="wizard-input" required type="number" min="0" max="100" step="0.01" value={signupData.academic.percentage12} onChange={(event) => updateSignupSection('academic', 'percentage12', event.target.value)} /></label>
                        <label className="field-group"><span>Physics percentage <small>(optional)</small></span><input className="wizard-input" type="number" min="0" max="100" step="0.01" value={signupData.academic.physics} onChange={(event) => updateSignupSection('academic', 'physics', event.target.value)} /></label>
                        <label className="field-group"><span>Chemistry percentage <small>(optional)</small></span><input className="wizard-input" type="number" min="0" max="100" step="0.01" value={signupData.academic.chemistry} onChange={(event) => updateSignupSection('academic', 'chemistry', event.target.value)} /></label>
                        <label className="field-group"><span>Mathematics percentage <small>(optional)</small></span><input className="wizard-input" type="number" min="0" max="100" step="0.01" value={signupData.academic.mathematics} onChange={(event) => updateSignupSection('academic', 'mathematics', event.target.value)} /></label>
                        <label className="field-group"><span>Class 12 passing year</span><input className="wizard-input" required type="number" min="2000" max="2035" value={signupData.academic.passingYear} onChange={(event) => updateSignupSection('academic', 'passingYear', event.target.value)} /></label>
                        <label className="field-group field-wide"><span>School name <small>(optional)</small></span><input className="wizard-input" value={signupData.academic.school} onChange={(event) => updateSignupSection('academic', 'school', event.target.value)} /></label>
                      </div>
                    ) : null}

                    {signupStep === 2 ? (
                      <div className="signup-exams">
                        <p className="form-note">Add any entrance exams you have taken. Results are optional if they are not available yet.</p>
                        {signupData.exams.map((exam, index) => (
                          <fieldset className="exam-card" key={exam.id}>
                            <legend>Exam {index + 1}</legend>
                            {signupData.exams.length > 1 ? <button type="button" className="text-link remove-exam" onClick={() => setSignupData((current) => ({ ...current, exams: current.exams.filter((item) => item.id !== exam.id) }))}>Remove</button> : null}
                            <div className="signup-fields">
                              <label className="field-group"><span>Exam</span><select className="wizard-input" value={exam.exam} onChange={(event) => updateSignupExam(exam.id, 'exam', event.target.value)}>{examOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                              <label className="field-group"><span>Percentile <small>(if applicable)</small></span><input className="wizard-input" type="number" min="0" max="100" step="0.001" value={exam.percentile} onChange={(event) => updateSignupExam(exam.id, 'percentile', event.target.value)} /></label>
                              <label className="field-group"><span>Score <small>(if applicable)</small></span><input className="wizard-input" type="number" min="0" step="any" value={exam.score} onChange={(event) => updateSignupExam(exam.id, 'score', event.target.value)} /></label>
                              <label className="field-group"><span>Rank <small>(if applicable)</small></span><input className="wizard-input" type="number" min="1" step="1" value={exam.rank} onChange={(event) => updateSignupExam(exam.id, 'rank', event.target.value)} /></label>
                              <label className="field-group"><span>Attempt</span><input className="wizard-input" value={exam.attempt} onChange={(event) => updateSignupExam(exam.id, 'attempt', event.target.value)} /></label>
                              <label className="field-group"><span>Session</span><input className="wizard-input" value={exam.session} onChange={(event) => updateSignupExam(exam.id, 'session', event.target.value)} /></label>
                            </div>
                          </fieldset>
                        ))}
                        <button type="button" className="secondary-btn small" onClick={() => setSignupData((current) => ({ ...current, exams: [...current.exams, createEmptyExam()] }))}>Add another exam</button>
                      </div>
                    ) : null}

                    {signupStep === 3 ? (
                      <div className="signup-fields">
                        <fieldset className="choice-field field-wide"><legend>Preferred branches <small>(select at least one)</small></legend><div className="choice-grid">{branchOptions.map((branch) => <label className="check-row" key={branch}><input type="checkbox" checked={signupData.preferences.branches.includes(branch)} onChange={() => toggleSignupPreference('branches', branch)} /><span>{branch}</span></label>)}</div></fieldset>
                        <fieldset className="choice-field field-wide"><legend>Preferred states <small>(optional)</small></legend><div className="choice-grid">{stateOptions.map((state) => <label className="check-row" key={state}><input type="checkbox" checked={signupData.preferences.states.includes(state)} onChange={() => toggleSignupPreference('states', state)} /><span>{state}</span></label>)}</div></fieldset>
                        <label className="field-group"><span>Institution type</span><select className="wizard-input" value={signupData.preferences.institutionType} onChange={(event) => updateSignupSection('preferences', 'institutionType', event.target.value)}><option>Both</option><option>Government</option><option>Private</option></select></label>
                        <label className="field-group"><span>Maximum annual fees (₹ lakh)</span><input className="wizard-input" required type="number" min="0" step="0.1" value={signupData.preferences.budget} onChange={(event) => updateSignupSection('preferences', 'budget', event.target.value)} placeholder="e.g. 5" /></label>
                        <label className="field-group"><span>Hostel preference</span><select className="wizard-input" value={signupData.preferences.hostel} onChange={(event) => updateSignupSection('preferences', 'hostel', event.target.value)}><option>No preference</option><option>Required</option><option>Not required</option></select></label>
                        <label className="field-group"><span>Distance preference</span><select className="wizard-input" value={signupData.preferences.distance} onChange={(event) => updateSignupSection('preferences', 'distance', event.target.value)}><option>Any distance</option><option>Within 250 km</option><option>Within 500 km</option><option>Within 1000 km</option></select></label>
                        <label className="field-group"><span>Interests <small>(optional)</small></span><input className="wizard-input" value={signupData.preferences.interests} onChange={(event) => updateSignupSection('preferences', 'interests', event.target.value)} /></label>
                        <label className="field-group"><span>Career goals <small>(optional)</small></span><input className="wizard-input" value={signupData.preferences.careerGoals} onChange={(event) => updateSignupSection('preferences', 'careerGoals', event.target.value)} /></label>
                      </div>
                    ) : null}

                    {signupStep === 4 ? (
                      <div className="signup-fields">
                        <p className="form-note field-wide">Additional information is optional and remains on this device. Do not enter sensitive information you do not want stored in this browser.</p>
                        <label className="field-group"><span>Category <small>(optional)</small></span><select className="wizard-input" value={signupData.additional.category} onChange={(event) => updateSignupSection('additional', 'category', event.target.value)}><option value="">Prefer not to say</option><option>General</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option></select></label>
                      </div>
                    ) : null}

                    {signupStep === 5 ? (
                      <div className="review-panel">
                        <h3>Review your details</h3>
                        <p><strong>{signupData.personal.fullName}</strong> · {signupData.personal.email} · {signupData.personal.state}{signupData.personal.district ? `, ${signupData.personal.district}` : ''}</p>
                        <p>Class 10: {signupData.academic.board10}, {signupData.academic.percentage10}% · Class 12: {signupData.academic.board12}, {signupData.academic.percentage12}% ({signupData.academic.passingYear})</p>
                        <p>Exams recorded: {signupData.exams.filter((exam) => exam.percentile || exam.score || exam.rank).map((exam) => exam.exam).join(', ') || 'No results entered'}</p>
                        <p>Branches: {signupData.preferences.branches.join(', ') || 'None selected'} · Max fees: ₹{signupData.preferences.budget}L per year</p>
                        <p>Category: {signupData.additional.category || 'Not provided'}</p>
                        <label className="check-row terms-row"><input type="checkbox" checked={signupData.agree} onChange={(event) => setSignupData((current) => ({ ...current, agree: event.target.checked }))} /><span>I understand this is a frontend demo account stored on this device, not a secure production account.</span></label>
                      </div>
                    ) : null}

                    {signupError ? <p className="status-message error" role="alert">{signupError}</p> : null}
                    {authStorageError ? <p className="status-message error" role="alert">{authStorageError}</p> : null}
                    <div className="wizard-actions">
                      {signupStep > 0 ? <button className="secondary-btn" type="button" onClick={() => { setSignupStep((step) => step - 1); setSignupError(''); }}>Back</button> : null}
                      <button className="primary-btn" type="submit" disabled={signupLoading}>
                        {signupLoading ? 'Creating demo account…' : signupStep === 5 ? 'Create demo account' : 'Continue'}
                        {signupStep < 5 ? <ArrowRight size={16} /> : null}
                      </button>
                    </div>
                    <p className="form-note">Demo only: passwords are salted and hashed in this browser, but frontend authentication is not production security.</p>
                    <div className="auth-footer">
                      <span>Already have an account?</span>
                      <button type="button" className="inline-link" onClick={() => { setAuthMode('login'); setSignupError(''); }}>
                        Log in
                      </button>
                    </div>
                  </form>
                )}
              </section>
            </div>
          </div>
        ) : (
          <div className="dashboard-shell public-shell">
            <header className="topbar public-topbar">
              <div className="brand-row">
                <div className="brand-mark">
                  <GraduationCap size={18} />
                </div>
                <span>CollegeGuide AI</span>
              </div>

              <nav className="nav-tabs" aria-label="Main navigation">
                {publicNavItems.map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    className={publicView === item.value ? 'nav-item active' : 'nav-item'}
                    onClick={() => {
                      if (item.value === 'home') setPublicView('home');
                      else setPublicView(item.value);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="header-actions">
                <button type="button" className="mobile-menu-button icon-button" aria-label={showMobileNav ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={showMobileNav} onClick={() => setShowMobileNav((open) => !open)}>
                  {showMobileNav ? <X size={18} /> : <Menu size={18} />}
                </button>
                <button type="button" className="icon-button" aria-label={darkMode ? 'Use light theme' : 'Use dark theme'} onClick={() => setDarkMode((current) => !current)}>
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button type="button" className="icon-button profile-nav-button" aria-label="Profile: sign in required" title="Sign in to view your profile" onClick={() => { setAuthMode('login'); setShowAuthFlow(true); setAccountNotice('Create a demo account or sign in to view your profile.'); }}>
                  <User size={17} />
                </button>
                <button type="button" className="secondary-btn small login-nav-button" onClick={() => { setAuthMode('login'); setShowAuthFlow(true); setAccountNotice(''); }}>
                  Log In
                </button>
                <button type="button" className="primary-btn small" onClick={() => { setAuthMode('signup'); setSignupStep(0); setSignupError(''); setShowAuthFlow(true); setAccountNotice(''); }}>
                  Sign Up
                </button>
              </div>
            </header>

            {showMobileNav ? (
              <nav className="mobile-nav-panel" aria-label="Mobile navigation">
                {publicNavItems.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={publicView === item.value ? 'nav-item active' : 'nav-item'}
                    onClick={() => {
                      setPublicView(item.value);
                      setShowMobileNav(false);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
                <button type="button" className="nav-item" onClick={() => { setAuthMode('login'); setShowAuthFlow(true); setShowMobileNav(false); setAccountNotice('Create a demo account or sign in to view your profile.'); }}>
                  Profile
                </button>
                <button type="button" className="secondary-btn small" onClick={() => { setAuthMode('login'); setShowAuthFlow(true); setShowMobileNav(false); }}>
                  Log In
                </button>
                <button type="button" className="primary-btn small" onClick={() => { setAuthMode('signup'); setSignupStep(0); setShowAuthFlow(true); setShowMobileNav(false); }}>
                  Sign Up
                </button>
              </nav>
            ) : null}

            <main className="main-content">{publicMainContent}</main>
          </div>
        )
      ) : (
        <div className="dashboard-shell">
          <header className="topbar">
            <div className="brand-row">
              <div className="brand-mark">
                <GraduationCap size={18} />
              </div>
              <span>CollegeGuide AI</span>
            </div>

            <nav className="nav-tabs" aria-label="Main navigation">
              {navItems.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  className={view === item.value ? 'nav-item active' : 'nav-item'}
                  onClick={() => setView(item.value)}
                >
                  {item.label}
                </button>
              ))}
              <button type="button" className="nav-item" onClick={() => { setAuthMode('login'); setShowAuthFlow(true); setShowMobileNav(false); setAccountNotice(''); }}>
                Log In
              </button>
              <button type="button" className="nav-item" onClick={() => { setAuthMode('signup'); setSignupStep(0); setSignupError(''); setShowAuthFlow(true); setShowMobileNav(false); setAccountNotice(''); }}>
                Sign Up
              </button>
            </nav>

            <div className="header-actions">
              <button type="button" className="icon-button" aria-label={darkMode ? 'Use light theme' : 'Use dark theme'} onClick={() => setDarkMode((current) => !current)}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button type="button" className="user-pill" onClick={() => setView('profile')}>
                <User size={16} />
                {profileData.fullName.split(' ')[0]}
              </button>
              <button type="button" className="secondary-btn small" onClick={logout}>Log out</button>
            </div>
          </header>

          <main className="main-content">{mainContent}</main>
        </div>
      )}

      {selectedCollege ? (
        <div className="modal-backdrop" onClick={() => setSelectedCollege(null)}>
          <div className="college-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setSelectedCollege(null)}>
              <X size={18} />
            </button>
            <CollegeImage college={selectedCollege} />
            <div className="modal-body">
              <div className="section-header compact no-gap">
                <div>
                  <p className="section-kicker">College detail</p>
                  <h2>{selectedCollege.name}</h2>
                </div>
                <button type="button" className="save-button modal-save" onClick={() => toggleSaved(selectedCollege.id)}>
                  <Bookmark size={16} fill={savedIds.includes(selectedCollege.id) ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="detail-grid">
                <div>
                  <span className="label">Location</span>
                  <strong>{selectedCollege.city}, {selectedCollege.state}</strong>
                </div>
                <div>
                  <span className="label">Type</span>
                  <strong>{selectedCollege.type}</strong>
                </div>
                <div>
                  <span className="label">Fees</span>
                  <strong>{selectedCollege.fees}</strong>
                </div>
                <div>
                  <span className="label">Average package</span>
                  <strong>{selectedCollege.package}</strong>
                </div>
                <div>
                  <span className="label">Placement rate</span>
                  <strong>{selectedCollege.placement}</strong>
                </div>
                <div>
                  <span className="label">NIRF rank</span>
                  <strong>Sample #{selectedCollege.nirf} · year unverified</strong>
                </div>
              </div>

              <p className="info-note">
                This is illustrative sample data. Ranking year, fees, and placement figures are not verified against official college sources. The linked photo source may document a campus image but does not validate the college metrics. Please confirm details with the institution before making decisions.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {showProfileWizard ? (
        <div className="modal-backdrop" onClick={() => setShowProfileWizard(false)}>
          <div className="profile-modal" onClick={(event) => event.stopPropagation()}>
            <div className="section-header compact no-gap">
              <div>
                <p className="section-kicker">Edit your profile</p>
                <h2>Academic details and college preferences</h2>
              </div>
              <button type="button" className="modal-close" aria-label="Close profile editor" onClick={() => setShowProfileWizard(false)}>
                <X size={18} />
              </button>
            </div>

            <p className="section-kicker">Preferred branches</p>
            <div className="choice-grid profile-choice-grid">
              {branchOptions.map((branch) => (
                <label className="check-row" key={branch}>
                  <input type="checkbox" checked={profileData.preferences?.branches?.includes(branch) || false} onChange={() => toggleProfilePreference('branches', branch)} />
                  <span>{branch}</span>
                </label>
              ))}
            </div>
            <p className="section-kicker">Preferred states</p>
            <div className="choice-grid profile-choice-grid">
              {stateOptions.map((state) => (
                <label className="check-row" key={state}>
                  <input type="checkbox" checked={profileData.preferences?.states?.includes(state) || false} onChange={() => toggleProfilePreference('states', state)} />
                  <span>{state}</span>
                </label>
              ))}
            </div>
            <div className="wizard-grid">
              <label><span>Maximum annual fees (₹ lakh)</span><input className="wizard-input" type="number" min="0" step="0.1" value={profileData.preferences?.budget || ''} onChange={(event) => updateProfilePreference('budget', event.target.value)} /></label>
              <label><span>Institution type</span><select className="wizard-input" value={profileData.preferences?.institutionType || 'Both'} onChange={(event) => updateProfilePreference('institutionType', event.target.value)}><option>Both</option><option>Government</option><option>Private</option></select></label>
              <label><span>Hostel preference</span><select className="wizard-input" value={profileData.preferences?.hostel || 'No preference'} onChange={(event) => updateProfilePreference('hostel', event.target.value)}><option>No preference</option><option>Required</option><option>Not required</option></select></label>
              <label><span>Distance preference</span><select className="wizard-input" value={profileData.preferences?.distance || 'Any distance'} onChange={(event) => updateProfilePreference('distance', event.target.value)}><option>Any distance</option><option>Within 250 km</option><option>Within 500 km</option><option>Within 1000 km</option></select></label>
              <label><span>Class 10 percentage</span><input className="wizard-input" type="number" min="0" max="100" step="0.01" value={profileData.academic?.percentage10 || ''} onChange={(event) => updateAcademicProfile('percentage10', event.target.value)} /></label>
              <label><span>Class 12 percentage</span><input className="wizard-input" type="number" min="0" max="100" step="0.01" value={profileData.academic?.percentage12 || ''} onChange={(event) => updateAcademicProfile('percentage12', event.target.value)} /></label>
              <label><span>Physics percentage</span><input className="wizard-input" type="number" min="0" max="100" step="0.01" value={profileData.academic?.physics || ''} onChange={(event) => updateAcademicProfile('physics', event.target.value)} /></label>
              <label><span>Chemistry percentage</span><input className="wizard-input" type="number" min="0" max="100" step="0.01" value={profileData.academic?.chemistry || ''} onChange={(event) => updateAcademicProfile('chemistry', event.target.value)} /></label>
              <label><span>Mathematics percentage</span><input className="wizard-input" type="number" min="0" max="100" step="0.01" value={profileData.academic?.mathematics || ''} onChange={(event) => updateAcademicProfile('mathematics', event.target.value)} /></label>
            </div>
            {profileData.exams?.length ? (
              <div className="profile-edit-exams">
                <p className="section-kicker">Entrance exams</p>
                {profileData.exams.map((exam) => (
                  <div className="wizard-grid exam-edit-row" key={exam.id}>
                    <strong>{exam.exam}</strong>
                    <label><span>Percentile</span><input className="wizard-input" type="number" min="0" max="100" step="0.001" value={exam.percentile} onChange={(event) => updateProfileExam(exam.id, 'percentile', event.target.value)} /></label>
                    <label><span>Score</span><input className="wizard-input" type="number" min="0" step="any" value={exam.score} onChange={(event) => updateProfileExam(exam.id, 'score', event.target.value)} /></label>
                    <label><span>Rank</span><input className="wizard-input" type="number" min="1" step="1" value={exam.rank} onChange={(event) => updateProfileExam(exam.id, 'rank', event.target.value)} /></label>
                  </div>
                ))}
              </div>
            ) : null}
            {authStorageError ? <p className="status-message error" role="alert">{authStorageError}</p> : null}

            <button type="button" className="primary-btn full-width" onClick={completeProfile}>
              Save profile
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
