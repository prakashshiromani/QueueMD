import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically attach JWT token to headers for protected routes
api.interceptors.request.use(
  (config) => {
    // Calling getState() reads the current persistent token unconditionally
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle 401 Unauthorized globally to prevent ghost sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config.url.includes('/auth/login');
      if (!isLoginRequest) {
        useAuthStore.getState().logout();
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);

// --- API Function Stubs --- 
// Note: Isolation (facilityId, facilityType) is handled implicitly 
// by the backend decoding the injected JWT Auth Headers! No manual payload needed!

export const searchPatientsApi = async (query) => {
  const response = await api.get(`/patients/search?q=${query}`);
  return response.data.data;
};

export const loginApi = (credentials) => api.post('/auth/login', credentials);
export const registerApi = (data) => api.post('/auth/register', data);

export const getFacilitiesApi = (type) => api.get(type ? `/facility?type=${type}` : '/facility');
export const createFacilityApi = (data) => api.post('/facility/create', data);

// ✅ 1. Add Patient
export const addPatientApi = async (payload) => {
  const response = await api.post('/queue/add', payload);
  return response.data;
};

// ✅ 2. Get Queue (Status driven)
export const fetchQueueApi = async (status = 'waiting', facilityType = null) => {
  const params = { status, limit: 50 };
  if (facilityType) params.type = facilityType;
  const response = await api.get('/queue', { params });
  return response.data.queue; // Returns the array of patients
};

// ✅ 3. Next Patient (Calls the oldest waiting patient)
export const nextPatientApi = async (facilityType = null) => {
  const body = facilityType ? { facilityType } : {};
  const response = await api.post('/queue/next', body);
  return response.data;
};

// ✅ 4. Get Completed Count
export const fetchCompletedCountApi = async (facilityType = null) => {
  const params = facilityType ? { type: facilityType } : {};
  const response = await api.get('/queue/stats/completed', { params });
  return response.data.completedToday;
};

// ✅ 5. Mark Patient Completed
export const markPatientCompletedApi = async (patientId, data = {}) => {
  const response = await api.patch(`/queue/${patientId}/complete`, data);
  return response.data;
};

// ✅ 6. Analytics Stats
export const fetchAnalyticsStatsApi = async (facilityType = null) => {
  const params = facilityType ? { type: facilityType } : {};
  const response = await api.get('/analytics/stats', { params });
  return response.data.stats || response.data.data || response.data;
};

export const fetchCompletedTodayApi = async (page = 1, search = "", facilityType = null) => {
  const params = { page, limit: 10, search };
  if (facilityType) params.type = facilityType;
  const response = await api.get('/analytics/completed-today', { params });
  return response.data;
};

// ✅ 7. Patient Directory
export const fetchPatientsApi = async (params = {}) => {
  const response = await api.get('/patients', { params });
  return response.data;
};

export const addPatientToDirectoryApi = async (payload) => {
  const response = await api.post('/patients/add', payload);
  return response.data;
};

export const togglePatientStatusApi = async (id) => {
  const response = await api.post(`/patients/${id}/toggle-status`);
  return response.data;
};

export const updatePatientApi = async (id, payload) => {
  const response = await api.put(`/patients/${id}`, payload);
  return response.data;
};

export const deletePatientApi = async (id) => {
  const response = await api.delete(`/patients/${id}`);
  return response.data;
};

// ✅ 8. Appointments
export const fetchAppointments = async (params) => {
  const res = await api.get("/appointments", { params });
  return res.data;
};

export const fetchTodaySchedule = async () => {
  const res = await api.get("/appointments/today");
  return res.data;
};

export const createAppointmentApi = async (data) => {
  const res = await api.post("/appointments", data);
  return res.data;
};

export const syncAppointmentsToDirectoryApi = async () => {
  const res = await api.post("/appointments/sync-to-directory");
  return res.data;
};

export const updateAppointmentApi = async (id, data) => {
  const res = await api.put(`/appointments/${id}`, data);
  return res.data;
};

export const updateAppointmentStatusApi = async (id, data) => {
  const res = await api.put(`/appointments/${id}/status`, data);
  return res.data;
};

export const deleteAppointmentApi = async (id) => {
  const res = await api.delete(`/appointments/${id}`);
  return res.data;
};

export const deletePatientEntirelyApi = async (patientId) => {
  const res = await api.delete(`/appointments/patients/${patientId}`);
  return res.data;
};

// ✅ 9. Lab Reports
export const fetchLabReportsApi = async (params) => {
  const res = await api.get("/lab/reports", { params });
  return res.data;
};

export const fetchLabStatsApi = async (params) => {
  const res = await api.get("/lab/stats", { params });
  return res.data;
};

export const updateLabStatusApi = async (id, status) => {
  const res = await api.put(`/lab/${id}/status`, { status });
  return res.data;
};

export const createLabOrderApi = async (data) => {
  const res = await api.post("/lab/create", data);
  return res.data;
};

// ✅ 10. Billing APIs
export const fetchBillingStats = async () => {
  const response = await api.get('/billing/stats');
  return response.data.data;
};

export const fetchInvoices = async (page = 1, filters = {}) => {
  const params = {
    page,
    limit: 10,
    ...filters
  };
  
  const response = await api.get('/billing/list', { params });
  return response.data;
};

export const createInvoiceApi = async (invoiceData) => {
  const response = await api.post('/billing/create', invoiceData);
  return response.data.data;
};

export const updateInvoiceStatus = async (invoiceId, status) => {
  const response = await api.patch(`/billing/${invoiceId}/status`, { status });
  return response.data.data;
};

// ✅ 11. Notification APIs
export const getNotifications = async (page = 1, limit = 10) => {
  return await api.get(`/notifications?page=${page}&limit=${limit}`);
};

export const markNotificationRead = async (id) => {
  return await api.post(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async () => {
  return await api.post(`/notifications/read-all`);
};

export default api;
