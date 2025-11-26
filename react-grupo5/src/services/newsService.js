// src/services/newsService.js
import api from "./apiService";
import { getToken } from "../utils/tokenStorage";

/**
 * Obtiene todas las novedades del sistema externo
 * Endpoint: GET /news
 * Requiere header: Authorization: Bearer {token}
 * @returns Promise con lista de noticias
 */
export const getAllNews = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const response = await api.get("/news", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data; // Lista de NewsDto
  } catch (error) {
    console.error(
      "Error fetching news:",
      error?.response?.status,
      error?.response?.data
    );
    throw error;
  }
};

export default {
  getAllNews,
};
