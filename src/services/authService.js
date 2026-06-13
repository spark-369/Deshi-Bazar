import { api, setAuthToken, setUser, clearAuth } from "./api";

export const authService = {
  async register(userData) {
    const data = await api.post("/api/auth/register", userData);
    if (data.token) {
      setAuthToken(data.token);
      setUser(data.user);
    }
    return data;
  },

  async login(userData) {
    const data = await api.post("/api/auth/login", userData);
    if (data.token) {
      setAuthToken(data.token);
      setUser(data.user);
    }
    return data;
  },

  logout() {
    clearAuth();
  },

  async getProfile() {
    const data = await api.get("/api/users/profile");
    return data;
  },

  async updateProfile(data) {
    const updated = await api.put("/api/users/profile", data);
    if (updated) {
      setUser(updated);
    }
    return updated;
  },

  async changePassword(data) {
    const result = await api.put("/api/users/profile", {
      action: "changePassword",
      ...data,
    });
    return result;
  },
};

export default authService;
