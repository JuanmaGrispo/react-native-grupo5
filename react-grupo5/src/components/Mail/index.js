import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { startOtpLogin } from "../../services/authService";
import { colors } from "../../theme";

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
        setErrorMsg("El correo no está registrado.");
      } else {
        setErrorMsg("Error enviando el código. Intente nuevamente.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingresá tu mail</Text>

      <Text style={styles.subtitle}>
        Te enviaremos un código de verificación para acceder.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#888"
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

export default MailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: { fontSize: 26, color: colors.text, marginBottom: 10, fontWeight: "bold" },
  subtitle: { fontSize: 15, color: colors.subtitle, textAlign: "center", marginBottom: 20 },
  input: {
    width: "100%",
    backgroundColor: colors.inputBackground,
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  button: {
    backgroundColor: colors.buttonBackground,
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: colors.buttonText, fontWeight: "bold", fontSize: 16 },
  errorText: { color: "red", fontSize: 14, marginBottom: 10 },
});
