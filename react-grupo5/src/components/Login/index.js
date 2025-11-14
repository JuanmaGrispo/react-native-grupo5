

import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { saveToken } from "../../utils/tokenStorage";
import api from "../../services/apiService";

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMsg("");
    if (!email.includes("@")) return setErrorMsg("Ingrese un email válido.");
    if (!password) return setErrorMsg("Ingrese su contraseña.");

    try {
      setLoading(true);
      const response = await api.post("/auth/login", {
        email,
        password,
        mode: "password"
      });

      if (response.data?.accessToken) {
        const token = response.data.accessToken;
        await saveToken(token);
        await login(token);
      } else {
        setErrorMsg("Credenciales incorrectas.");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setErrorMsg("Credenciales incorrectas.");
      } else {
        setErrorMsg("Error al iniciar sesión. Intente nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Te hemos extrañado</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#777"
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          placeholderTextColor="#777"
          value={password}
          secureTextEntry={!showPassword}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Ingresando..." : "Entrar"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Mail")}>
        <Text style={styles.linkText}>Iniciar sesión por código</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#000"
  },
  title: { 
    fontSize: 24, 
    marginBottom: 20, 
    fontWeight: "bold",
    color: "#FFD700"
  },
  input: { 
    backgroundColor: "#1A1A1A",
    color: "#FFD700",
    borderWidth: 1,
    padding: 10,
    width: "100%",
    marginBottom: 15,
    borderColor: "#555",
    borderRadius: 8 
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  passwordInput: { 
    flex: 1, 
    paddingVertical: 10, 
    color: "#FFD700" 
  },
  button: { 
    backgroundColor: "#FFD700", 
    padding: 10, 
    borderRadius: 8, 
    width: "100%", 
    alignItems: "center", 
    marginBottom: 12 
  },
  buttonText: { 
    color: "#000", 
    fontWeight: "bold" 
  },
  linkText: { 
    color: "#FFD700", 
    fontSize: 16, 
    marginTop: 5 
  },
  errorText: { 
    color: "red", 
    marginBottom: 10, 
    fontSize: 14 
  },
});
