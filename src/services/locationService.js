import { api } from "./api";

export const locationService = {
  // Get all divisions (country is always Bangladesh)
  async getDivisions() {
    const data = await api.get("/api/locations");
    return data;
  },

  // Get districts for a division
  async getDistricts(division) {
    const data = await api.get(`/api/locations?division=${encodeURIComponent(division)}`);
    return data;
  },

  // Get postal codes for a division + district
  async getPostalCodes(division, district) {
    const data = await api.get(
      `/api/locations?division=${encodeURIComponent(division)}&district=${encodeURIComponent(district)}`,
    );
    return data;
  },
};

export default locationService;
