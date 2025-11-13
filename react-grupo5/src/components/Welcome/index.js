import React, { useEffect, useContext, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { AuthContext } from "../../context/AuthContext";
import { getToken } from "../../utils/tokenStorage";
import { colors } from "../../theme";

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
          navigation.replace("MainTabs");
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
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={styles.subtitle}>Verificando identidad...</Text>
      </View>
    );
  }

  if (showWelcome) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.gymName}>RitmoFit</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.welcomeText}>Bienvenido/a</Text>
          <Text style={styles.description}>
            Estás por ingresar a RitmoFit, donde te convertiremos en tu mejor versión.
          </Text>

          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  header: { alignItems: "center", marginTop: 80 },
  gymName: { fontSize: 40, fontWeight: "bold", color: colors.text },
  content: { alignItems: "center", marginTop: 40 },
  welcomeText: { fontSize: 24, fontWeight: "600", color: colors.text, marginBottom: 10 },
  description: {
    fontSize: 16,
    color: colors.subtitle,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: colors.buttonBackground,
    padding: 14,
    borderRadius: 10,
    width: "70%",
    alignItems: "center",
  },
  buttonText: { color: colors.buttonText, fontSize: 18, fontWeight: "bold" },
  subtitle: { color: colors.subtitle, marginTop: 10 },
});

export default WelcomeScreen;
