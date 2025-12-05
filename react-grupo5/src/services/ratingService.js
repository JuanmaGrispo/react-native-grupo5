import api from "./apiService";

/**
 * Crea una calificación para una sesión completada
 * @param {string} sessionId - ID de la sesión
 * @param {number} rating - Calificación de 1 a 5
 * @param {string} [comment] - Comentario opcional (máx 1000 caracteres)
 * @returns {Promise<Object>} - Calificación creada
 */
export const createRating = async (sessionId, rating, comment) => {
  try {
    const response = await api.post("/ratings", {
      sessionId,
      rating,
      comment: comment || undefined,
    });
    return response.data;
  } catch (error) {
    console.error("Error al crear calificación:", {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

/**
 * Obtiene todas las calificaciones del usuario autenticado
 * @returns {Promise<Array>} - Lista de calificaciones del usuario
 */
export const getMyRatings = async () => {
  try {
    const response = await api.get("/ratings/me");
    return response.data;
  } catch (error) {
    console.error("Error al obtener mis calificaciones:", {
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * Obtiene todas las calificaciones de una sesión específica
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Array>} - Lista de calificaciones de la sesión
 */
export const getSessionRatings = async (sessionId) => {
  try {
    const response = await api.get(`/ratings/session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener calificaciones de la sesión:", {
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * Obtiene la calificación promedio y el total de calificaciones de una sesión
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Object>} - { average: number, count: number }
 */
export const getSessionAverageRating = async (sessionId) => {
  try {
    const response = await api.get(`/ratings/session/${sessionId}/average`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener promedio de calificaciones:", {
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * Actualiza una calificación existente
 * @param {string} ratingId - ID de la calificación
 * @param {number} [rating] - Nueva calificación (1-5)
 * @param {string} [comment] - Nuevo comentario
 * @returns {Promise<Object>} - Calificación actualizada
 */
export const updateRating = async (ratingId, rating, comment) => {
  try {
    const response = await api.put(`/ratings/${ratingId}`, {
      rating,
      comment: comment || undefined,
    });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar calificación:", {
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * Elimina una calificación
 * @param {string} ratingId - ID de la calificación
 * @returns {Promise<Object>} - Respuesta de éxito
 */
export const deleteRating = async (ratingId) => {
  try {
    const response = await api.delete(`/ratings/${ratingId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar calificación:", {
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

