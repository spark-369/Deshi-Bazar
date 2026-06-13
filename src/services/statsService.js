import { api } from "./api";

const statsService = {
  // Get platform statistics
  async getStats() {
    const data = await api.get("/api/stats");
    return data;
  },
};

export default statsService;
