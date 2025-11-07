import api from "./apiService";

export const loginPassword = async (email, password) => {
  const response = await api.post("/auth/login", { email, password, mode: "password" });
  return response.data;
};

export const startOtpLogin = async (email) => {
  const response = await api.post("/auth/login", { email, mode: "otp" });
  return response.data;
};

export const verifyOtpLogin = async (email, code) => {
  const response = await api.post("/auth/login/verify", { email, code });
  return response.data;
};
