import api from './api';

export const labApi = {
  // Get all lab reports with pagination & filters
  getReports: async (params) => {
    const res = await api.get('/lab/reports', { params });
    return res.data;
  },

  // Get summary stats (Pending, Processing, etc.)
  getStats: async (params) => {
    const res = await api.get('/lab/stats', { params });
    return res.data;
  },

  // Update status (pending -> processing -> ready -> delivered)
  updateStatus: async (id, status) => {
    const res = await api.put(`/lab/${id}/status`, { status });
    return res.data;
  },

  // Update lab order details (Edit)
  updateOrder: async (id, data) => {
    const res = await api.put(`/lab/${id}`, data);
    return res.data;
  },

  // Delete lab order
  deleteOrder: async (id) => {
    const res = await api.delete(`/lab/${id}`);
    return res.data;
  },

  // Create new lab order
  createOrder: async (data) => {
    const res = await api.post('/lab/create', data);
    return res.data;
  }
};
