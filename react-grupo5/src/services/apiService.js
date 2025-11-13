import axios from "axios";
import { getToken } from "../utils/tokenStorage"; 



//const API_BASE_URL = "http://localhost:3000/api/v1"; // Cambiar si usás emulador Android o dispositivo físico

//Web
//const API_BASE_URL = "http://localhost:3000/api/v1"; 

//Android porque sino no anda
const API_BASE_URL = "http://192.168.1.13:3000/api/v1";



const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

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
