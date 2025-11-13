import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { Camera } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../../utils/tokenStorage"; // 👈 IMPORTANTE
import { getClasses } from "../../services/apiService";
import { Picker } from "@react-native-picker/picker";

export default function HomeScreen() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [error, setError] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Filtros
  const [sede, setSede] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [fecha, setFecha] = useState("");

  // Opciones únicas
  const [sedes, setSedes] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [fechas, setFechas] = useState([]);

  //  Obtener token real y cargar clases
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = await getToken(); // Token  desde AsyncStorage

        if (!token) {
          setError("No se encontró el token. Iniciá sesión nuevamente.");
          setLoadingClasses(false);
          return;
        }

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
        console.error("Error al cargar clases:", err);
        setError("Error al cargar las clases.");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Filtrado dinámico
  useEffect(() => {
    let filtered = classes;

    if (sede) filtered = filtered.filter((c) => c.locationName === sede);
    if (disciplina) filtered = filtered.filter((c) => c.discipline === disciplina);
    if (fecha) filtered = filtered.filter((c) => c.createdAt.startsWith(fecha));

    setFilteredClasses(filtered);
  }, [sede, disciplina, fecha, classes]);

  // ⏳ Loader
  if (loadingClasses || loadingPermissions) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando clases...</Text>
      </View>
    );
  }

  // ❌ Error
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  // ✅ Lista
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

      <Text style={styles.label}>Sede</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={sede} onValueChange={(value) => setSede(value)}>
          <Picker.Item label="Todas" value="" />
          {sedes.map((s, i) => (
            <Picker.Item key={i} label={s} value={s} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Disciplina</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={disciplina} onValueChange={(value) => setDisciplina(value)}>
          <Picker.Item label="Todas" value="" />
          {disciplinas.map((d, i) => (
            <Picker.Item key={i} label={d} value={d} />
          ))}
        </Picker>
      </View>

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
