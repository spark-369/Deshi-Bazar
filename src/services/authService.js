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

  async verify2FA(tempToken, code) {
    const data = await api.post("/api/auth/2fa/verify", { code }, {
      headers: {
        Authorization: `Bearer ${tempToken}`,
      },
    });
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

  async forgotPassword(email) {
    return api.post("/api/auth/forgot-password", { email });
  },

  async resetPassword(token, password) {
    return api.post("/api/auth/reset-password", { token, password });
  },

  async enable2FA() {
    const data = await api.post("/api/users/2fa");
    return data;
  },

  async verify2FACode(code) {
    const data = await api.post("/api/users/2fa/verify", { code });
    return data;
  },

  async disable2FA() {
    const data = await api.delete("/api/users/2fa");
    return data;
  },
};

export default authService;
