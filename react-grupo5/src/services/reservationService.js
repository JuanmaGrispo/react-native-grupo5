import api from "./apiService";
import { getToken } from "../utils/tokenStorage";

export const getReservations = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const response = await api.get("/reservations/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching reservations:",
      error?.response?.status,
      error?.response?.data
    );
    throw error;
  }
};

export const cancelReservation = async (sessionId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const response = await api.patch(
      `/reservations/${sessionId}/cancel`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
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

