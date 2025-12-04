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

/**
 * Escanea un QR y obtiene los datos del turno
 * Endpoint: POST /qr/scan
 * Body: { qrData: string }
 * @param {string} qrData - El contenido del QR escaneado (sessionId)
 * @returns Promise con datos del turno (clase, horario, sede)
 */
export const scanQR = async (qrData) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const response = await api.post(
      "/qr/scan",
      { qrData },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error scanning QR:",
      error?.response?.status,
      error?.response?.data
    );
    throw error;
  }
};

/**
 * Confirma el check-in por QR
 * Endpoint: POST /checkin/qr
 * Body: { sessionId: string }
 * @param {string} sessionId - ID de la sesión
 * @returns Promise con datos de la asistencia creada
 */
export const checkInByQR = async (sessionId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const response = await api.post(
      "/checkin/qr",
      { sessionId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error checking in by QR:",
      error?.response?.status,
      error?.response?.data
    );
    throw error;
  }
};

export default {
  getMyAttendance,
  scanQR,
  checkInByQR,
};

