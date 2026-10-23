import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

export const api = {
  // Health
  getHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },

  // Colleges
  getColleges: async (params = {}) => {
    const res = await client.get('/api/colleges', { params });
    return res.data;
  },

  getCollege: async (id) => {
    const res = await client.get(`/api/colleges/${id}`);
    return res.data;
  },

  // Recommendations
  getRecommendations: async (profile) => {
    const res = await client.post('/api/recommendations', profile);
    return res.data;
  },

  // College Comparison
  compareColleges: async (collegeIds, courseCode = null) => {
    const res = await client.post('/api/compare', {
      college_ids: collegeIds,
      course_code: courseCode,
    });
    return res.data;
  },

  // Chatbot / RAG
  getChatConfig: async () => {
    const res = await client.get('/api/chat/config');
    return res.data;
  },

  updateChatConfig: async (configPayload) => {
    const res = await client.post('/api/chat/config', configPayload);
    return res.data;
  },

  sendMessage: async (
    message,
    studentProfile = null,
    selectedCollegeIds = [],
    conversationHistory = [],
    sessionId = null,
    modelType = 'slm'
  ) => {
    const res = await client.post('/api/chat', {
      message,
      student_profile: studentProfile,
      selected_college_ids: selectedCollegeIds,
      conversation_history: conversationHistory,
      session_id: sessionId,
      model_type: modelType,
    });
    return res.data;
  },

  // Scholarships
  getScholarships: async (collegeId = null) => {
    const params = collegeId ? { college_id: collegeId } : {};
    const res = await client.get('/api/scholarships', { params });
    return res.data;
  },

  // Sources
  getSources: async () => {
    const res = await client.get('/api/sources');
    return res.data;
  },

  // Admin Ingestion
  adminIngest: async (formData, adminKey) => {
    const res = await client.post('/api/admin/ingest', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Admin-Key': adminKey,
      },
    });
    return res.data;
  },

  adminReindex: async (adminKey) => {
    const res = await client.post('/api/admin/reindex', {}, {
      headers: {
        'X-Admin-Key': adminKey,
      },
    });
    return res.data;
  },
};

export default api;
