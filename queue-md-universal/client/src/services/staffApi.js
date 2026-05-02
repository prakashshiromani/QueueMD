import api from "./api";

export const staffApi = {
  getAll: async (params = {}) => {
    const { data } = await api.get("/user/staff", { params });
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/user/${id}`, payload);
    return data;
  },
  toggleStatus: async (id, isActive) => {
    const { data } = await api.patch(`/user/${id}/status`, { isActive });
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/user/${id}`);
    return data;
  }
};
