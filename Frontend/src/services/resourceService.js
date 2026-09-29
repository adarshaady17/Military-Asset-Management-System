import api from "./api";
export const resourceService = {
  list: (resource, params = {}) => api.get(`/${resource}`, { params }),
  create: (resource, data) => api.post(`/${resource}`, data),
  dashboard: (params = {}) => api.get("/dashboard", { params }),
  movement: (params = {}) => api.get("/dashboard/movement", { params }),
};
