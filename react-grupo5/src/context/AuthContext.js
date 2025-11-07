import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken, removeToken, saveToken } from "../utils/tokenStorage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [isLoading, setIsLoading] = useState(true); 
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = await getToken();
      const firstLogin = await AsyncStorage.getItem("hasLoggedInBefore");

      setHasLoggedInBefore(firstLogin === "true");
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (token) => {
    await saveToken(token);
    await AsyncStorage.setItem("hasLoggedInBefore", "true");
    setIsAuthenticated(true);
    setHasLoggedInBefore(true);
  };

  const logout = async () => {
    await removeToken();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, isLoading, hasLoggedInBefore }}
    >
      {children}
    </AuthContext.Provider>
  );
};
