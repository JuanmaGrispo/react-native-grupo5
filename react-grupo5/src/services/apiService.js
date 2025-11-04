import axios from "axios";
import { getToken } from "../utils/tokenStorage"; 
//const API_BASE_URL = "http://localhost:3000/api/v1"; // Cambiar si usás emulador Android o dispositivo físico

const API_BASE_URL = "http://192.168.1.13:3000/api/v1"; // celular

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});


export const getClasses = async () => {
  try {
    const token = await getToken(); 
    const response = await api.get("/classes", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching classes:", error.response?.data || error.message);
    throw error;
  }
};

export default api;
