import axios from "axios";
import { getToken } from "../utils/tokenStorage";
import Constants from "expo-constants";

// Obtener la URL base de la API desde las variables de entorno
// Si no está configurada, usar localhost por defecto
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:3000/api/v1";

// Crear instancia de axios configurada
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token automáticamente a todas las peticiones
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Si es FormData, no establecer Content-Type (axios lo hace automáticamente)
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }
    } catch (error) {
      console.error("Error al obtener token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const fullUrl = `${error.config?.baseURL || API_BASE_URL}${error.config?.url || ""}`;
      const method = error.config?.method?.toUpperCase() || "UNKNOWN";
      
      console.error("❌ Error de respuesta:", {
        method,
        status: error.response.status,
        statusText: error.response.statusText,
        url: fullUrl,
        data: error.response.data,
      });
    } else if (error.request) {
      const fullUrl = `${error.config?.baseURL || API_BASE_URL}${error.config?.url || ""}`;
      console.error("❌ Error de red - No se recibió respuesta:", {
        url: fullUrl,
        message: error.message,
      });
      console.error("Verifica que el servidor esté corriendo y accesible en:", API_BASE_URL);
    } else {
      console.error("❌ Error al configurar la petición:", error.message);
    }
    return Promise.reject(error);
  }
);


// 🔹 Obtener todas las clases
export const getAllClasses = async () => {
  const token = await getToken();

  const res = await axios.get(`${API_BASE_URL}/classes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

// 🔹 Obtener todas las sesiones de TODAS las clases
export const getAllSessions = async () => {
  const token = await getToken();

  const res = await axios.get(`${API_BASE_URL}/classes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const classes = res.data;

  const allSessions = [];

  for (const cls of classes) {
    const sessionsResponse = await axios.get(
      `${API_BASE_URL}/classes/${cls.id}/sessions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    allSessions.push({
      class_id: cls.id,
      class_name: cls.name,
      sessions: sessionsResponse.data,
    });
  }

  return allSessions;
};

// 🔹 Obtener sesiones sólo de UNA clase específica
export const getClassSessions = async (classId) => {
  const token = await getToken();

  const res = await axios.get(
    `${API_BASE_URL}/classes/${classId}/sessions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};

// Exportar la instancia de axios configurada como default
export default api;
