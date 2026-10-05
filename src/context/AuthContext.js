"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { authService, getAuthToken, getUser, clearAuth, setAuthToken } from "@/services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const token = getAuthToken();
        const storedUser = getUser();

        if (token && storedUser && mounted) {
          setUser(storedUser);
          setIsAuthenticated(true);

          try {
            const profile = await authService.getProfile();
            if (mounted && profile) {
              setUser(profile);
              setIsAuthenticated(true);
            }
          } catch (error) {
            if (mounted) {
              if (error.status === 401 || error.status === 403) {
                clearAuth();
                setUser(null);
                setIsAuthenticated(false);
              } else {
                setUser(storedUser);
                setIsAuthenticated(true);
              }
            }
          }
        }
      } catch (error) {
        if (mounted) {
          clearAuth();
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (userData) => {
    const data = await authService.login(userData);
    if (data.requires2FA) {
      return data;
    }
    if (data.token) {
      setAuthToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    }
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    if (data.requires2FA) {
      return data;
    }
    if (data.token) {
      setAuthToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    }
    return data;
  };

  const verify2FA = async (tempToken, code) => {
    const data = await authService.verify2FA(tempToken, code);
    if (data.token) {
      setAuthToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    }
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (data) => {
    const updatedUser = await authService.updateProfile(data);
    setUser(updatedUser);
    return updatedUser;
  };

  const enable2FA = async () => {
    const data = await authService.enable2FA();
    return data;
  };

  const verify2FACode = async (code) => {
    const data = await authService.verify2FACode(code);
    if (data.message && data.message.includes("enabled")) {
      if (user) {
        setUser({ ...user, twoFactorEnabled: true });
      }
    }
    return data;
  };

  const disable2FA = async () => {
    const data = await authService.disable2FA();
    if (data.message && data.message.includes("disabled")) {
      if (user) {
        setUser({ ...user, twoFactorEnabled: false });
      }
    }
    return data;
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated,
    login,
    register,
    verify2FA,
    logout,
    updateProfile,
    enable2FA,
    verify2FACode,
    disable2FA,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
