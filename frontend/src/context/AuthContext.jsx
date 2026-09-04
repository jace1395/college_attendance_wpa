import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Hydrate auth state from localStorage on app boot
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("access_token");

    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        // Corrupted storage — clear it
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Login — POST /api/auth/login/
  // Returns the user's role so the caller can redirect to the right dashboard.
  // ---------------------------------------------------------------------------
  const loginAsync = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login/`, {
        email,
        password,
      });

      const {
        access,
        refresh,
        user: userData,
      } = response.data;
      // userData shape: { id, name, email, role, is_hod, is_mentor, is_timetable_incharge }

      // Persist tokens and user profile
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);

      return userData.role; // consumed by RouteGuard / login page for redirect
    } finally {
      setIsLoading(false);
    }
    // Errors bubble up to the calling component so it can show a toast / message
  };

  // ---------------------------------------------------------------------------
  // Logout — clear all local state and storage
  // ---------------------------------------------------------------------------
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login: loginAsync, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);