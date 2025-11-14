import api from "./apiService";

export const loginPassword = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password, mode: "password" });
    return response.data;
  } catch (error) {
    console.error("Error en loginPassword:", {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      body: error.config?.data,
    });
    throw error;
  }
};

export const startOtpLogin = async (email) => {
  try {
    // Asegurarse de que solo se envían los campos necesarios
    const body = { email, mode: "otp" };
    console.log("Enviando OTP request:", body);
    const response = await api.post("/auth/login", body);
    return response.data;
  } catch (error) {
    console.error("Error en startOtpLogin:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      body: error.config?.data,
      fullUrl: `${error.config?.baseURL}${error.config?.url}`,
    });
    throw error;
  }
};

export const verifyOtpLogin = async (email, code) => {
  try {
    const response = await api.post("/auth/login/verify", { email, code });
    return response.data;
  } catch (error) {
    console.error("Error en verifyOtpLogin:", {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      body: error.config?.data,
    });
    throw error;
  }
};
