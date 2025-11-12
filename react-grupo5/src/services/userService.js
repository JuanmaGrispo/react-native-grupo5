// src/services/userService.js
import api from "./apiService";
import { getToken } from "../utils/tokenStorage";

/**
 * Obtiene el usuario actual (requiere Bearer token).
 * Endpoint esperado: GET /users/me
 */
export const getCurrentUser = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const response = await api.get("/user/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // { id, name, email, ... }
  } catch (error) {
    console.error(
      "Error fetching current user:",
      error?.response?.status,
      error?.response?.data
    );
    throw error;
  }
};

/**
 * Actualiza el nombre del usuario actual (requiere Bearer token).
 * Endpoint esperado: PUT /users/me  body: { name }
 */
export const updateCurrentUserName = async (name) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const response = await api.put(
      "/user/me",
      { name },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating user name:",
      error?.response?.status,
      error?.response?.data
    );
    throw error;
  }
};

export default {
  getCurrentUser,
  updateCurrentUserName,
};
