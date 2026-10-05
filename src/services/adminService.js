import { api } from "./api";

export const adminService = {
  // Get analytics
  async getAnalytics(period = "30") {
    const data = await api.get("/api/admin/analytics", {
      params: { period },
    });
    return data;
  },

  // Get churn predictions
  async getChurnPredictions(params = {}) {
    const data = await api.get("/api/admin/churn-predictions", { params });
    return data;
  },

  // Get all orders (admin) - both regular and custom
  async getOrders(params = {}) {
    const data = await api.get("/api/admin/orders", { params });
    return data;
  },

  // Get all products (admin)
  async getProducts(params = {}) {
    const data = await api.get("/api/admin/products", { params });
    return data;
  },

  // Bulk update products
  async updateProducts(productIds, action, data = {}) {
    const result = await api.put("/api/admin/products", {
      productIds,
      action,
      data,
    });
    return result;
  },

  // Get all users (admin)
  async getUsers(params = {}) {
    const data = await api.get("/api/admin/users", { params });
    return data;
  },

  // Get single user detail (admin)
  async getUser(id) {
    const data = await api.get("/api/admin/users", { params: { id } });
    return data.user;
  },

  // Update user (admin)
  async updateUser(userId, action, data = {}) {
    const result = await api.put("/api/admin/users", {
      userId,
      action,
      data,
    });
    return result;
  },

  // Delete user (admin)
  async deleteUser(userId) {
    const result = await api.delete(`/api/admin/users?id=${userId}`);
    return result;
  },
};

export default adminService;
