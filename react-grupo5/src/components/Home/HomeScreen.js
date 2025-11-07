import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { Camera } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getClasses } from "../../services/apiService";
import {Picker} from "@react-native-picker/picker"

// Token provisional para probar (después se obtiene del login)
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NGVmZjJmNS1hYjljLTQ4ZjMtODdjZi0yZWZmZTQyZDgwMWEiLCJlbWFpbCI6ImJhbHRhLm1hcmVuZGFAZ21haWwuY29tIiwiaWF0IjoxNzYxODQ3NzA3LCJleHAiOjE3NjI0NTI1MDd9.1MATBwddZHuGwQ888nay0jiBOpjBERfgbf5X4ZokXvQ";

const PERMISSIONS_KEY = "permissions_requested";

export default function HomeScreen() {
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [sede, setSede] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [fecha, setFecha] = useState("");

  // Opciones únicas
  const [sedes, setSedes] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [fechas, setFechas] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await getClasses(token);
        setClasses(data);
        setFilteredClasses(data);

        // Generar opciones únicas para los dropdowns
        const sedesUnicas = [...new Set(data.map((c) => c.locationName).filter(Boolean))];
        const disciplinasUnicas = [...new Set(data.map((c) => c.discipline).filter(Boolean))];
        const fechasUnicas = [...new Set(data.map((c) => c.createdAt.split("T")[0]))];

        setSedes(sedesUnicas);
        setDisciplinas(disciplinasUnicas);
        setFechas(fechasUnicas);
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
  // Filtrado dinámico
  useEffect(() => {
    let filtered = classes;

    if (sede) filtered = filtered.filter((c) => c.locationName === sede);
    if (disciplina) filtered = filtered.filter((c) => c.discipline === disciplina);
    if (fecha) filtered = filtered.filter((c) => c.createdAt.startsWith(fecha));

    setFilteredClasses(filtered);
  }, [sede, disciplina, fecha, classes]);

  if (loading) {
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
      <Text style={styles.header}>Filtrar Clases</Text>

      {/* Filtro Sede */}
      <Text style={styles.label}>Sede</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={sede} onValueChange={(value) => setSede(value)}>
          <Picker.Item label="Todas" value="" />
          {sedes.map((s, i) => (
            <Picker.Item key={i} label={s} value={s} />
          ))}
        </Picker>
      </View>

      {/* Filtro Disciplina */}
      <Text style={styles.label}>Disciplina</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={disciplina} onValueChange={(value) => setDisciplina(value)}>
          <Picker.Item label="Todas" value="" />
          {disciplinas.map((d, i) => (
            <Picker.Item key={i} label={d} value={d} />
          ))}
        </Picker>
      </View>

      {/* Filtro Fecha */}
      <Text style={styles.label}>Fecha</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={fecha} onValueChange={(value) => setFecha(value)}>
          <Picker.Item label="Todas" value="" />
          {fechas.map((f, i) => (
            <Picker.Item key={i} label={f} value={f} />
          ))}
        </Picker>
      </View>

      <FlatList
        data={filteredClasses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={{ textAlign: "center" }}>No hay clases disponibles</Text>}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  label: {
    fontWeight: "600",
    marginTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: "#333",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: "red",
  },
});
