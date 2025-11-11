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
        {}
        <View style={styles.header}>
          <Text style={styles.gymName}>RitmoFit</Text>
        </View>

        {}
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Bienvenido/a</Text>

          <Text style={styles.description}>
            Estas por ingresar a RitmoFit, donde te convertiremos en tu mejor versión.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Login")}
          >
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
    backgroundColor: "#f5f5f5",
    padding: 16
  },
  header: {
    alignItems: "center",
    marginTop: 100, 
  },
  gymName: { 
    fontSize: 35, 
    fontWeight: "bold", 
    color: "#000",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: { 
    fontSize: 21, 
    fontWeight: "600", 
    color: "#333", 
    marginBottom: 10 
  },
  description: { 
    fontSize: 16, 
    color: "#666", 
    textAlign: "center", 
    marginBottom: 30, 
    paddingHorizontal: 20 
  },
  button: { 
    backgroundColor: "#007AFF", 
    padding: 12, 
    borderRadius: 8, 
    width: "70%", 
    alignItems: "center" 
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "bold" 
  },
});

export default WelcomeScreen;
