import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [studentProfile, setStudentProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('college_guide_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [recommendations, setRecommendations] = useState(null);
  const [compareList, setCompareList] = useState([]);

  useEffect(() => {
    if (studentProfile) {
      localStorage.setItem('college_guide_profile', JSON.stringify(studentProfile));
    } else {
      localStorage.removeItem('college_guide_profile');
    }
  }, [studentProfile]);

  const addToCompare = (college) => {
    if (compareList.some((c) => c.id === college.id)) return;
    if (compareList.length >= 4) {
      alert('You can compare a maximum of 4 colleges at a time.');
      return;
    }
    setCompareList([...compareList, college]);
  };

  const removeFromCompare = (collegeId) => {
    setCompareList(compareList.filter((c) => c.id !== collegeId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const clearProfile = () => {
    setStudentProfile(null);
    setRecommendations(null);
    localStorage.removeItem('college_guide_profile');
  };

  return (
    <AppContext.Provider
      value={{
        studentProfile,
        setStudentProfile,
        recommendations,
        setRecommendations,
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        clearProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
