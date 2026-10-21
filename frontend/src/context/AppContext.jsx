import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

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

  // Shared Chatbot State across Floating Widget and /chat Page
  const [sessionId, setSessionId] = useState(
    () => 'sess_' + Math.random().toString(36).substring(2, 9)
  );
  const [modelType, setModelType] = useState('slm');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am **College Guide AI**, your admissions assistant for Indian engineering admissions (B.Tech / B.E.). \n\nI answer questions strictly using verified university brochures, fee schedules, and historical cutoffs in our database.\n\n**What would you like to explore today?**`,
      citations: [],
      evidence_used: [],
    },
  ]);
  const [llmConfig, setLlmConfig] = useState({
    llm_enabled: false,
    llm_provider: 'fallback',
    llm_model: 'gemini-1.5-flash',
    message: 'LLM mode disabled (no API key configured). Operating in Local SLM mode.'
  });

  useEffect(() => {
    api.getChatConfig()
      .then((cfg) => {
        setLlmConfig(cfg);
        if (!cfg.llm_enabled) {
          setModelType('slm');
        }
      })
      .catch(() => {});
  }, []);

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
        sessionId,
        setSessionId,
        modelType,
        setModelType,
        messages,
        setMessages,
        llmConfig,
        setLlmConfig
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
