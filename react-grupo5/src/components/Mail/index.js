import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { startOtpLogin } from "../../services/authService";

const MailScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendCode = async () => {
    setErrorMsg("");

    // 1️⃣ Validar email
    if (!email.includes("@")) {
      setErrorMsg("Ingrese un email válido.");
      return;
    }

    try {
      // 2️⃣ Llamar al backend para iniciar OTP
      await startOtpLogin(email);
      navigation.navigate("ConfirmOtp", { email });
    } catch (error) {
      console.error("Error enviando OTP:", error);
      // 3️⃣ Mensaje según status
      if (error.response?.status === 404) {
        setErrorMsg("Credenciales incorrectas.");
      } else {
        setErrorMsg("Error enviando OTP. Intente nuevamente.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingrese su mail</Text>

      <TextInput
        style={styles.input}
        placeholder="Ingrese su email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setErrorMsg(""); 
        }}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSendCode}>
        <Text style={styles.buttonText}>Enviar código</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5", paddingHorizontal: 20 },
  title: { fontSize: 22, marginBottom: 16 },
  input: { width: "100%", backgroundColor: "#fff", padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: "#ccc" },
  button: { backgroundColor: "#007AFF", padding: 12, borderRadius: 8, width: "100%", alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "bold" },
  errorText: { color: "red", fontSize: 14, marginBottom: 8 },
});

export default MailScreen;
