import api from "./api";

export const userService = {
  list: (params = {}) => api.get("/users", { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  updateStatus: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),
  remove: (id) => api.delete(`/users/${id}`),
};
