import axios from "axios";
import { getToken } from "../utils/tokenStorage";
import Constants from "expo-constants";

// Obtener la URL base de la API desde las variables de entorno
// Si no está configurada, usar localhost por defecto
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:3000/api/v1";

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
      // Esto evita problemas con el boundary en multipart/form-data
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
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
      // El servidor respondió con un código de estado fuera del rango 2xx
      const fullUrl = `${error.config?.baseURL || API_BASE_URL}${error.config?.url || ''}`;
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      
      console.error("❌ Error de respuesta:", {
        method,
        status: error.response.status,
        statusText: error.response.statusText,
        url: fullUrl,
        data: error.response.data,
      });
      
      // Mensaje más descriptivo para 404
      if (error.response.status === 404) {
        console.error(`⚠️ 404 - Endpoint no encontrado: ${method} ${fullUrl}`);
        console.error("Verifica que:");
        console.error("1. El servidor esté corriendo en:", API_BASE_URL);
        console.error("2. La ruta del endpoint sea correcta");
        console.error("3. El método HTTP sea el correcto (GET, POST, etc.)");
        console.error("4. El body enviado:", JSON.stringify(error.config?.data || {}, null, 2));
      }
      
      // Mensaje para errores de validación (400)
      if (error.response.status === 400) {
        console.error(`⚠️ 400 - Error de validación: ${method} ${fullUrl}`);
        console.error("Detalles del error:", error.response.data);
        console.error("Body enviado:", JSON.stringify(error.config?.data || {}, null, 2));
      }
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta
      const fullUrl = `${error.config?.baseURL || API_BASE_URL}${error.config?.url || ''}`;
      console.error("❌ Error de red - No se recibió respuesta:", {
        url: fullUrl,
        message: error.message,
      });
      console.error("Verifica que el servidor esté corriendo y accesible en:", API_BASE_URL);
    } else {
      // Algo pasó al configurar la petición
      console.error("❌ Error al configurar la petición:", error.message);
    }
    return Promise.reject(error);
  }
);

// Función para obtener clases con Bearer Token
export const getClasses = async (token) => {
  try {
    const response = await api.get("/classes", {
      headers: {
        Authorization: `Bearer ${token}`,  // <--- Aca va el token
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching classes:", error.response?.status, error.response?.data);
    throw error;
  }
};

export default api;