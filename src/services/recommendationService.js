import { api } from "./api";

const recommendationService = {
  // Get recommendations (for user or admin)
  async getRecommendations(params = {}) {
    const data = await api.get("/api/recommendations", { params });
    return data;
  },

  // Generate recommendations for a user (admin only)
  async generateAIRecommendations(email) {
    const result = await api.post("/api/recommendations", {
      generateAI: true,
      email,
    });
    return result;
  },

  // Create manual recommendation (admin only)
  async createRecommendation(data) {
    const result = await api.post("/api/recommendations", data);
    return result;
  },

  // Update recommendation (admin only)
  async updateRecommendation(id, data) {
    const result = await api.put("/api/recommendations", {
      id,
      ...data,
    });
    return result;
  },

  // Delete recommendation (admin only)
  async deleteRecommendation(id) {
    const result = await api.delete(`/api/recommendations?id=${id}`);
    return result;
  },
};

export default recommendationService;
