import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Store token in localStorage
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Load token on app init (safely handle missing localStorage)
try {
  const savedToken = localStorage.getItem('authToken');
  if (savedToken) {
    setAuthToken(savedToken);
  }
} catch (err) {
  console.warn('localStorage not available (private browsing?)');
}

// Create API client
const apiClient = axios.create({
  baseURL: API_BASE,
});

// Add interceptor for requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Add interceptor for errors (redirect to login on 401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: (userName, accountId, password) =>
    apiClient.post('/auth/register', { userName, accountId, password }),
  
  login: (accountId, password) =>
    apiClient.post('/auth/login', { accountId, password }),
  
  verify: () =>
    apiClient.get('/auth/verify'),
};

// User API
export const userAPI = {
  getUser: (accountId) =>
    apiClient.get(`/users/${accountId}`),
  
  getAllUsers: () =>
    apiClient.get('/users'),
  
  getUserStats: (accountId) =>
    apiClient.get(`/users/${accountId}/stats`),
};

// Timeline API
export const timelineAPI = {
  createTimeline: (value) =>
    apiClient.post('/timelines', { value }),
  
  getTimelines: () =>
    apiClient.get('/timelines'),
  
  getTimeline: (timelineId) =>
    apiClient.get(`/timelines/${timelineId}`),
  
  // Phase 7.4: Builder configuration persistence
  saveBuilderConfig: (timelineId, config) =>
    apiClient.put(`/timelines/${timelineId}/builder-config`, { config }),
  
  getBuilderConfig: (timelineId) =>
    apiClient.get(`/timelines/${timelineId}/builder-config`),
};

// Category API
export const categoryAPI = {
  createCategory: (timelineId, category) =>
    apiClient.post('/categories', { timelineId, category }),
  
  getCategories: (timelineId) =>
    apiClient.get(`/categories/${timelineId}`),
};

// Item API
export const itemAPI = {
  createItem: (categoryId, itemValue) =>
    apiClient.post('/items', { categoryId, itemValue }),
  
  getItems: (categoryId) =>
    apiClient.get(`/items/${categoryId}`),
};

// Session API
export const sessionAPI = {
  createSession: (state, timeline) =>
    apiClient.post('/sessions', { state, timeline }),
  
  getSession: (sessionId) =>
    apiClient.get(`/sessions/${sessionId}`),
  
  updateSession: (sessionId, state) =>
    apiClient.put(`/sessions/${sessionId}`, { state }),
  
  restoreSession: (sessionId) =>
    apiClient.get(`/sessions/${sessionId}/restore`),
};

// Analysis API
export const analysisAPI = {
  getAnomalies: (timelineId) =>
    apiClient.get(`/anomalies/${timelineId}`),
  
  getMilestones: (userId) =>
    apiClient.get(`/milestones/${userId}`),

  // Phase 17.2.0: Multi-atom analysis API
  getAtomStatus: (atom) =>
    apiClient.get(`/api/analysis/${atom}/status`),
  
  startAtomTraining: (atom, config = {}) =>
    apiClient.post(`/api/analysis/${atom}/train`, config),
  
  stopAtomTraining: (atom) =>
    apiClient.delete(`/api/analysis/${atom}/train`),
  
  compareAtoms: () =>
    apiClient.get(`/api/analysis/atoms/compare`),

  // Cluster API (Phase 17.2.1)
  getClusterNodes: () =>
    apiClient.get(`/api/cluster/nodes`),
  
  getClusterMilestones: () =>
    apiClient.get(`/api/cluster/milestones`),
};

export default apiClient;
