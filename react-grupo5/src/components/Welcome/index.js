import React, { useEffect, useContext, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { AuthContext } from "../../context/AuthContext";
import { getToken } from "../../utils/tokenStorage"; 

const WelcomeScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [checkingBiometrics, setCheckingBiometrics] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const checkBiometrics = async () => {
      const token = await getToken(); 

      if (!token) {
        setShowWelcome(true);
        setCheckingBiometrics(false);
        return;
      }


      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && enrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Iniciar sesión con biometría",
        });

        if (result.success) {
          await login(token); 
          navigation.replace("Home");
        } else {
          navigation.replace("Login"); 
        }
      } else {
        navigation.replace("Login"); 
      }

      setCheckingBiometrics(false);
    };

    checkBiometrics();
  }, []);

  if (checkingBiometrics) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16 }}>Verificando identidad...</Text>
      </View>
    );
  }

  if (showWelcome) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>¡Bienvenido!</Text>
        <Text style={styles.subtitle}>
          Gracias por instalar la app. Presiona “Entrar” para comenzar.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null; // mientras decide navegación, no renderizar nada
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5", padding: 16 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 16 },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 30 },
  button: { backgroundColor: "#007AFF", padding: 12, borderRadius: 8, width: "70%", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

export default WelcomeScreen;
