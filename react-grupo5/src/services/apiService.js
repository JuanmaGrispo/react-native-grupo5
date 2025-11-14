import axios from "axios";
import { getToken } from "../utils/tokenStorage";

//const API_BASE_URL = "http://localhost:3000/api/v1";

//const API_BASE_URL = "http://192.168.1.25:3000/api/v1";

const API_BASE_URL = "http://10.0.2.2:3000/api/v1";





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
