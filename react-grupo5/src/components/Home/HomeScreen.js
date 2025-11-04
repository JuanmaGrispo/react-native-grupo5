import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { Camera } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getClasses } from "../../services/apiService";

const PERMISSIONS_KEY = "permissions_requested";

export default function HomeScreen() {
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [error, setError] = useState(null);

  // Cargar clases
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await getClasses();
        setClasses(data || []); // Asegurarse que sea array
      } catch (err) {
        console.error(err);
        setError("Error al cargar las clases.");
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);


  useEffect(() => {
    const requestPermissions = async () => {
      const alreadyRequested = await AsyncStorage.getItem(PERMISSIONS_KEY);
      if (!alreadyRequested) {
        const notif = await Notifications.requestPermissionsAsync();
        const cam = await Camera.requestCameraPermissionsAsync();

        if (notif.status !== "granted" || cam.status !== "granted") {
          Alert.alert(
            "Permisos requeridos",
            "Para usar todas las funciones, habilitá cámara y notificaciones."
          );
        }

        await AsyncStorage.setItem(PERMISSIONS_KEY, "true");
      }
      setLoadingPermissions(false);
    };

    requestPermissions();
  }, []);

  // Si todavía estamos cargando clases o permisos
  if (loadingClasses || loadingPermissions) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>Disciplina: {item.discipline}</Text>
      <Text style={styles.text}>Duración: {item.defaultDurationMin} min</Text>
      <Text style={styles.text}>Cupos: {item.defaultCapacity}</Text>
      <Text style={styles.text}>Profesor: {item.instructorName ?? "Sin asignar"}</Text>
      <Text style={styles.text}>Ubicación: {item.locationName ?? "No especificada"}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={{ textAlign: "center" }}>No hay clases disponibles</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7", padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  text: { fontSize: 14, color: "#333" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "red" },
});
