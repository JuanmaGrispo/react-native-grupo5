// src/services/attendanceService.js
import api from "./apiService";
import { getToken } from "../utils/tokenStorage";

/**
 * Obtiene el historial de asistencias del usuario autenticado
 * Endpoint: GET /attendance/me
 * Requiere header: Authorization: Bearer {token}
 * @returns Promise con lista de AttendanceDto
 */
export const getMyAttendance = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const response = await api.get("/attendance/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // Array de AttendanceDto
  } catch (error) {
    console.error(
      "Error fetching attendance history:",
      error?.response?.status,
      error?.response?.data
    );
    throw error;
  }
};

export default {
  getMyAttendance,
};

