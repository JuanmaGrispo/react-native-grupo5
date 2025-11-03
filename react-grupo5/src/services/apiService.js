// src/services/apiService.js
import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api/v1"; // Cambiar si usás emulador Android o dispositivo físico

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

export const getClasses = async () => {
  try {
    const response = await api.get("/classes");
    return response.data;
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error;
  }
};

export default api;
