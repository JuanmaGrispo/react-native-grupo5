import React, { useRef, useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { saveToken } from "../../utils/tokenStorage";
import { verifyOtpLogin, startOtpLogin } from "../../services/authService";
import { CommonActions } from "@react-navigation/native"

const ConfirmOtpScreen = ({ navigation, route }) => {
  const { login } = useContext(AuthContext);
  const email = route.params?.email;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); 
  const [status, setStatus] = useState(null); 
  const [errorMsg, setErrorMsg] = useState("");
  const inputs = useRef([]);

  const handleChange = async (text, index) => {
    if (/^\d$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (index < 5) inputs.current[index + 1].focus();

      if (newOtp.every((d) => d !== "")) {
const codeToSend = newOtp.join("");
        await verifyOtp(codeToSend);
      } else {
        setStatus(null);
        setErrorMsg("");
      }
    } else if (text === "") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      setStatus(null);
      setErrorMsg("");
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const verifyOtp = async (code) => {
    if (!email) return;

    try {
const sanitizedCode = code.replace(/\s/g, ''); 
const response = await verifyOtpLogin(email, sanitizedCode);

if (response && response.accessToken) {
  setStatus("success");
  await saveToken(response.accessToken);
  await login(response.accessToken);
  navigation.dispatch(
  CommonActions.reset({
    index: 0,
    routes: [{ name: "MainTabs" }],
  })
);
} else {
        setStatus("error");
        setErrorMsg("Código incorrecto");
      }
    } catch (error) {
      console.error("Error al verificar OTP:", error);
      setStatus("error");
      setErrorMsg("Código incorrecto");
    }
  };

  const handleResend = async () => {
    try {
      await startOtpLogin(email);
      setOtp(["", "", "", "", "", ""]);
      setStatus(null);
      setErrorMsg("");
      inputs.current[0].focus();
      Alert.alert("Código enviado", "Se envió un nuevo código a tu correo.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo reenviar el código.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmar Código</Text>
      <Text style={styles.subtitle}>Ingresá el código de 6 dígitos que te enviamos a {email}</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={[
              styles.otpInput,
              status === "success" && { borderColor: "green" },
              status === "error" && { borderColor: "red" },
            ]}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="numeric"
            maxLength={1}
            autoFocus={index === 0}
          />
        ))}
      </View>

      {status === "error" && <Text style={styles.errorText}>{errorMsg}</Text>}

      <TouchableOpacity style={styles.resendButton} onPress={handleResend}>
        <Text style={styles.resendText}>Reenviar código</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
  },
  title: { fontSize: 22, marginBottom: 8, fontWeight: "bold" },
  subtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 20 },
otpContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  width: "80%",
  marginBottom: 10,
  marginLeft: -25, 
},
otpInput: {
  width: 45,
  height: 50,
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  textAlign: "center",
  fontSize: 20,
  marginHorizontal: 2, 
},


  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },
  resendButton: {
    paddingVertical: 10,
  },
  resendText: {
    fontSize: 14,
    color: "#000", 
  },
});

export default ConfirmOtpScreen;
