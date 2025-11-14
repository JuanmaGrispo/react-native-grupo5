import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { startOtpLogin } from "../../services/authService";

const MailScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendCode = async () => {
    setErrorMsg("");

    if (!email.includes("@")) {
      setErrorMsg("Ingrese un email válido.");
      return;
    }

    try {
      await startOtpLogin(email);
      navigation.navigate("ConfirmOtp", { email });
    } catch (error) {
      console.error("Error enviando OTP:", error);
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
        placeholderTextColor="#777"
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
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#000",
    paddingHorizontal: 20 
  },
  title: { 
    fontSize: 28, 
    color: "#FFD700", 
    fontWeight: "bold",
    marginBottom: 20 
  },
  input: { 
    width: "100%",
    backgroundColor: "#111",
    color: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333"
  },

  // 🔥 Botón amarillo
  button: { 
    backgroundColor: "#FFD700",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 10
  },
  buttonText: { 
    color: "#000",
    fontWeight: "bold",
    fontSize: 16 
  },

  errorText: { 
    color: "#FF4444",
    fontSize: 14,
    marginBottom: 8 
  },
});

export default MailScreen;
