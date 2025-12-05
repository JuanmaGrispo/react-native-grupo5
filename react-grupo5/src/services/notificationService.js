import api from "./apiService";

export const getUnreadNotifications = async () => {
  try {
    const response = await api.get("/notifications");
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

export const getAllNotifications = async () => {
  try {
    const response = await api.get("/notifications?all=true");
    return response.data;
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    throw error;
  }
};

export const markAsRead = async (notificationId) => {
  try {
    await api.post(`/notifications/${notificationId}/read`, {});
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

export const markAllAsRead = async () => {
  try {
    await api.post("/notifications/read-all", {});
  } catch (error) {
    console.error("Error marking all as read:", error);
    throw error;
  }
};

export const markAsUnread = async (notificationId) => {
  try {
    // Si el backend no tiene este endpoint, lo manejamos localmente
    // Por ahora asumimos que existe o lo implementamos en el frontend
    await api.post(`/notifications/${notificationId}/unread`, {});
  } catch (error) {
    console.error("Error marking notification as unread:", error);
    // Si no existe el endpoint, no lanzamos error, solo lo manejamos localmente
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    await api.delete(`/notifications/${notificationId}`);
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

