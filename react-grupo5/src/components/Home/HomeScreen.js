import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
  ActionSheetIOS,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

import { getAllClasses, getAllSessions } from "../../services/apiService";
import { createReservation } from "../../services/reservationService";

export default function HomeScreen() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [sede, setSede] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [fecha, setFecha] = useState("");

  const [sedes, setSedes] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [fechas, setFechas] = useState([]);

  const [filteredSessions, setFilteredSessions] = useState([]);
  const [reservationLoadingId, setReservationLoadingId] = useState(null);

  // 🔥 Cargar clases y sesiones
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1️⃣ Clases
        const classesData = await getAllClasses();
        setClasses(classesData);

        // 2️⃣ Sesiones
        const sessionGroups = await getAllSessions();

        // sessionGroups es algo así:
        // [
        //   { class_id, class_name, sessions: [] }
        // ]

        const flatSessions = [];

        sessionGroups.forEach((group) => {
          group.sessions.forEach((session) => {
            flatSessions.push({
              ...session,
              classInfo: {
                id: group.class_id,
                title: group.class_name,
                discipline: classesData.find((c) => c.id === group.class_id)?.discipline,
                locationName: classesData.find((c) => c.id === group.class_id)?.locationName,
                instructorName: classesData.find((c) => c.id === group.class_id)?.instructorName,
              },
            });
          });
        });

        setSessions(flatSessions);
        setFilteredSessions(flatSessions);

        // Filtros
        setSedes([...new Set(flatSessions.map((s) => s.classInfo.locationName).filter(Boolean))]);
        setDisciplinas([...new Set(flatSessions.map((s) => s.classInfo.discipline).filter(Boolean))]);
        setFechas([...new Set(flatSessions.map((s) => s.startAt.split("T")[0]))]);

      } catch (err) {
        console.error(err);
        setError("Error cargando clases o sesiones.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // 🔎 Filtrar sesiones
  useEffect(() => {
    let filtered = sessions;

    if (sede) filtered = filtered.filter((s) => s.classInfo.locationName === sede);
    if (disciplina) filtered = filtered.filter((s) => s.classInfo.discipline === disciplina);
    if (fecha) filtered = filtered.filter((s) => s.startAt.startsWith(fecha));

    setFilteredSessions(filtered);
  }, [sede, disciplina, fecha, sessions]);

  // 📌 Picker de iOS
  const showIOSPicker = (label, options, currentValue, onSelect) => {
    const items = ["Todas", ...options];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: label,
        options: [...items, "Cancelar"],
        cancelButtonIndex: items.length,
        userInterfaceStyle: "dark",
      },
      (index) => {
        if (index === items.length) return;
        const selected = items[index];
        onSelect(selected === "Todas" ? "" : selected);
      }
    );
  };

  // 📌 Renderizador de filtro
  const renderFilter = (label, value, options, onChange) => {
    const displayValue = value || "Todas";

    if (Platform.OS === "ios") {
      return (
        <View key={label} style={styles.filterGroup}>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => showIOSPicker(label, options, value, onChange)}
          >
            <Text style={styles.pickerButtonText}>{displayValue}</Text>
            <Ionicons name="chevron-down" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View key={label} style={styles.filterGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={value}
            onValueChange={onChange}
            dropdownIconColor="#fff"
            style={styles.picker}
          >
            <Picker.Item label="Todas" value="" />
            {options.map((opt) => (
              <Picker.Item key={opt} label={opt} value={opt} />
            ))}
          </Picker>
        </View>
      </View>
    );
  };

  // Loader
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando clases y sesiones...</Text>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  // 📌 Reservar
  const handleReserve = async (session) => {
    try {
      setReservationLoadingId(session.id);
      await createReservation(session.id);
      Alert.alert("Reserva creada", "Tu reserva fue registrada.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo reservar esta sesión.");
    } finally {
      setReservationLoadingId(null);
    }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString("es-AR");

  const renderItem = ({ item }) => {
    const reserving = reservationLoadingId === item.id;

    return (
      <View style={styles.card}>
        <Text style={styles.title}>{item.classInfo.title}</Text>

        <Text style={styles.text}>Fecha: {formatDate(item.startAt)}</Text>
        <Text style={styles.text}>Disciplina: {item.classInfo.discipline}</Text>
        <Text style={styles.text}>Duración: {item.durationMin} min</Text>
        <Text style={styles.text}>Profesor: {item.classInfo.instructorName ?? "No asignado"}</Text>
        <Text style={styles.text}>Ubicación: {item.classInfo.locationName ?? "Sin ubicación"}</Text>

        <TouchableOpacity
          style={[styles.reserveButton, reserving && styles.reserveButtonDisabled]}
          onPress={() => handleReserve(item)}
          disabled={reserving}
        >
          <Text style={styles.reserveButtonText}>
            {reserving ? "Reservando..." : "Reservar"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Filtrar Sesiones</Text>

      {renderFilter("Sede", sede, sedes, setSede)}
      {renderFilter("Disciplina", disciplina, disciplinas, setDisciplina)}
      {renderFilter("Fecha", fecha, fechas, setFecha)}

      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ color: "#fff", textAlign: "center" }}>No hay sesiones disponibles</Text>}
      />
    </View>
  );
}

/* --- estilos --- */

const COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  yellow: "#FFD800",
  gray: "#3A3A3A",
  darkerGray: "#222222",
  red: "#FF3B30",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    paddingHorizontal: 24,
    paddingTop: 49,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.black,
  },
  error: {
    color: COLORS.red,
    fontSize: 16,
    textAlign: "center",
  },
  header: {
    color: COLORS.yellow,
    fontSize: 42,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 24,
  },
  label: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 4,
  },
  filterGroup: {
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    backgroundColor: COLORS.darkerGray,
    overflow: "hidden",
  },
  picker: {
    color: COLORS.white,
    height: 44,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    backgroundColor: COLORS.darkerGray,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "500",
  },
  card: {
    backgroundColor: COLORS.darkerGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  reserveButton: {
    marginTop: 12,
    backgroundColor: COLORS.yellow,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  reserveButtonDisabled: {
    opacity: 0.6,
  },
  reserveButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  text: {
    color: COLORS.white,
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.9,
  },
});
