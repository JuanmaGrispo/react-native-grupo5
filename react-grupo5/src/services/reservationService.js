// src/services/reservationService.js
import api from "./apiService";
import { getToken } from "../utils/tokenStorage";

/**
 * Obtiene todas las reservas del usuario actual (requiere Bearer token).
 * Endpoint: GET /reservations/me
 */
export const getReservations = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const response = await api.get("/reservations/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // Array de reservas
  } catch (error) {
    console.error(
      "Error fetching reservations:",
      error?.response?.status,
      error?.response?.data
    );
    throw error;
  }
};

/**
 * Cancela una reserva por sessionId (requiere Bearer token).
 * Endpoint: PATCH /reservations/:sessionId/cancel
 */
export const cancelReservation = async (sessionId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const response = await api.patch(`/reservations/${sessionId}/cancel`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error canceling reservation:",
      error?.response?.status,
      error?.response?.data
    );
    throw error;
  }
};

/**
 * Crea una nueva reserva (requiere Bearer token).
 * Endpoint: POST /reservations
 * Body: { sessionId: string }
 */
export const createReservation = async (sessionId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const response = await api.post(
      "/reservations",
      { sessionId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating reservation:",
      error?.response?.status,
      error?.response?.data
    );
    throw error;
  }
};

export default {
  getReservations,
  cancelReservation,
  createReservation,
};

