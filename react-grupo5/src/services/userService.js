// src/services/userService.js
import api from "./apiService";

// 🔹 Obtener el perfil del usuario actual
export const getCurrentUser = async () => {
  try {
    const response = await api.get("/users/me");
    return response.data; // { id, name, email, ... }
  } catch (error) {
    console.error("Error fetching current user:", error.response?.status, error.response?.data);
    throw error;
  }
};

// 🔹 Actualizar el nombre del usuario
export const updateCurrentUserName = async (name) => {
  try {
    const response = await api.put("/users/me", { name });
    return response.data;
  } catch (error) {
    console.error("Error updating user name:", error.response?.status, error.response?.data);
    throw error;
  }
};
