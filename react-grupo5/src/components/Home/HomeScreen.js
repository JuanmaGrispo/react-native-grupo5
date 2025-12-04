import React, { useEffect, useState, useRef } from "react";
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
  Linking,
  Animated,
} from "react-native";

import Constants from "expo-constants";

import api from "../../services/apiService";


import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

import { getAllClasses, getAllSessions } from "../../services/apiService";
import { createReservation } from "../../services/reservationService";

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);

  // Filtros
  const [sede, setSede] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [fecha, setFecha] = useState("");

  // Valores dinámicos del filtro
  const [sedes, setSedes] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [fechas, setFechas] = useState([]);

  const [reservationLoadingId, setReservationLoadingId] = useState(null);

  // DIRECCIÓN FIJA DE LA SEDE (puede ser dinámica si querés)
const [sedeDireccion, setSedeDireccion] = useState("");

  // Estado para colapsar/expandir filtros
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const filterAnimation = useRef(new Animated.Value(1)).current;


  // --- Función para abrir Google Maps ---
  const openMaps = (address) => {
  console.log("📍 DIRECCIÓN RECIBIDA:", address);

  if (!address) {
    Alert.alert("Dirección no disponible", "No se pudo abrir Google Maps.");
    return;
  }

  const encodedAddress = encodeURIComponent(address);

  const url = Platform.OS === "ios"
    ? `http://maps.apple.com/?q=${encodedAddress}`
    : `geo:0,0?q=${encodedAddress}`;

  console.log("🔗 URL A ABRIR:", url);

  Linking.openURL(url).catch((err) => {
    console.log("❌ Error al abrir Maps:", err);
    Alert.alert(
      "Error",
      "No se pudo abrir Google Maps. Verifica que tengas instalada la app."
    );
  });
};


  // --- CARGAR CLASES + SESIONES ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const classesData = await getAllClasses();
        const sessionsGrouped = await getAllSessions();

        const flat = sessionsGrouped.flatMap((group) =>
          group.sessions.map((session) => {
            const cls = classesData.find((c) => c.id === session.classRef.id);
            return {
              ...session,
              classInfo: {
                id: session.classRef.id,
                title: session.classRef.title,
                discipline: session.classRef.discipline,
                description: session.classRef.description,
                instructorName: session.classRef.instructorName,
              },
              branchName: session.branch?.name,
              branchLocation: session.branch?.location,
            };
          })
        );

        setSessions(flat);
        setFilteredSessions(flat);

        setSedes([...new Set(flat.map((s) => s.branchName).filter(Boolean))]);
        setDisciplinas([
          ...new Set(flat.map((s) => s.classInfo.discipline).filter(Boolean)),
        ]);
        setFechas([
          ...new Set(flat.map((s) => s.startAt.split("T")[0]).filter(Boolean)),
        ]);
      } catch (err) {
        console.error(err);
        setError("Error cargando clases o sesiones.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);



useEffect(() => {
  const loadAddress = async () => {
    try {
      const json = await api.get("/branches/main");
      console.log("📍 DIRECCIÓN DESDE BACK:", json.data);
      setSedeDireccion(json.data.location);
    } catch (e) {
      console.error("Error cargando dirección:", e);
    }
  };

  loadAddress();
}, []);




  // --- FILTROS ---
  useEffect(() => {
    let result = sessions;
    if (sede) result = result.filter((s) => s.branchName === sede);
    if (disciplina) result = result.filter((s) => s.classInfo.discipline === disciplina);
    if (fecha) result = result.filter((s) => s.startAt.startsWith(fecha));
    setFilteredSessions(result);
  }, [sede, disciplina, fecha, sessions]);

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

  const renderFilter = (label, value, options, onChange) => {
    const displayValue = value || "Todas";

    if (Platform.OS === "ios") {
      return (
        <View key={label} style={styles.filterItem}>
          <Text style={styles.filterLabel}>{label}</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => showIOSPicker(label, options, value, onChange)}
          >
            <Text style={styles.pickerButtonText} numberOfLines={1} ellipsizeMode="tail">{displayValue}</Text>
            <Ionicons name="chevron-down" size={14} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View key={label} style={styles.filterItem}>
        <Text style={styles.filterLabel}>{label}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={value}
            onValueChange={onChange}
            dropdownIconColor="#fff"
            style={styles.picker}
            itemStyle={styles.pickerItem}
            mode="dropdown"
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

  // --- RESERVAR SESIÓN ---
  const handleReserve = async (session) => {
    try {
      setReservationLoadingId(session.id);
      await createReservation(session.id);
      Alert.alert("Reserva creada", "Tu reserva fue registrada.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo reservar la clase.");
    } finally {
      setReservationLoadingId(null);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD800" />
        <Text style={{ color: "#fff" }}>Cargando...</Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );

  const formatDate = (iso) =>
    new Date(iso).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });

  const renderItem = ({ item }) => {
    const reserving = reservationLoadingId === item.id;

    return (
      <View style={styles.card}>
        <Text style={styles.title}>{item.classInfo.title}</Text>
        <Text style={styles.text}>Disciplina: {item.classInfo.discipline}</Text>
        <Text style={styles.text}>Fecha: {formatDate(item.startAt)}</Text>
        <Text style={styles.text}>Duración: {item.durationMin} min</Text>
        <Text style={styles.text}>
          Cupos: {item.reservedCount}/{item.capacity}
        </Text>
        <Text style={styles.text}>
          Profesor: {item.classInfo.instructorName || "No asignado"}
        </Text>
        <Text style={styles.text}>Sede: {item.branchName || "Sin sede"}</Text>
        <Text style={styles.text}>
          Dirección: {item.branchLocation || "No disponible"}
        </Text>

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
      <Text style={styles.header}>RitmoFit</Text>

      {/* BOTÓN FIJO DE MAPA - SIEMPRE VISIBLE */}
<TouchableOpacity 
  style={[styles.mapButton, !sedeDireccion && { opacity: 0.5 }]}
  onPress={() => openMaps(sedeDireccion)}
  disabled={!sedeDireccion}
>
  <Text style={styles.mapButtonText}>
    {sedeDireccion ? "Cómo llegar a la sede" : "Cargando dirección..."}
  </Text>
</TouchableOpacity>

      {/* Filtros */}
      <Animated.View
        style={[
          styles.filtersSection,
          {
            paddingVertical: filterAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [6, 12],
            }),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.collapseButton}
          onPress={() => {
            const toValue = isFiltersExpanded ? 0 : 1;
            setIsFiltersExpanded(!isFiltersExpanded);
            Animated.timing(filterAnimation, {
              toValue,
              duration: 300,
              useNativeDriver: false,
            }).start();
          }}
        >
          <Ionicons
            name={isFiltersExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={COLORS.white}
          />
        </TouchableOpacity>
        <Animated.View
          style={{
            maxHeight: filterAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500],
            }),
            opacity: filterAnimation,
            overflow: "hidden",
          }}
        >
          {renderFilter("Sede", sede, sedes, setSede)}
          {renderFilter("Disciplina", disciplina, disciplinas, setDisciplina)}
          {renderFilter("Fecha", fecha, fechas, setFecha)}
        </Animated.View>
      </Animated.View>

      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ color: "#fff", textAlign: "center", marginTop: 20 }}>
            No hay clases disponibles
          </Text>
        }
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
  container: { flex: 1, backgroundColor: COLORS.black, paddingHorizontal: 24, paddingTop: 49, paddingBottom: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.black },
  error: { color: COLORS.red, fontSize: 16, textAlign: "center" },
  header: { color: COLORS.yellow, fontSize: 42, textAlign: "center", fontWeight: "700", marginBottom: 24 },
  filtersSection: {
    backgroundColor: COLORS.darkerGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 16,
  },
  filterItem: {
    marginBottom: 12,
  },
  collapseButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },
  filterLabel: { color: COLORS.white, fontSize: 12, marginBottom: 4, opacity: 0.8 },
  pickerContainer: { borderWidth: 1, borderColor: COLORS.gray, borderRadius: 8, backgroundColor: COLORS.gray, overflow: "hidden", minHeight: 50, justifyContent: "center" },
  picker: { color: COLORS.white, height: 50, width: "100%" },
  pickerItem: { color: COLORS.white, fontSize: 14 },
  pickerButton: { borderWidth: 1, borderColor: COLORS.gray, borderRadius: 8, backgroundColor: COLORS.gray, paddingHorizontal: 12, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 50 },
  pickerButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "500", flex: 1 },
  card: { backgroundColor: COLORS.darkerGray, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#333" },
  reserveButton: { marginTop: 12, backgroundColor: COLORS.yellow, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  reserveButtonDisabled: { opacity: 0.6 },
  reserveButtonText: { color: COLORS.black, fontSize: 16, fontWeight: "600" },
  title: { color: COLORS.white, fontSize: 18, fontWeight: "600", marginBottom: 8 },
  text: { color: COLORS.white, fontSize: 14, marginBottom: 4, opacity: 0.9 },
mapButton: { 
  marginTop: 12, 
  backgroundColor: "#FFD800", 
  borderRadius: 8, 
  paddingVertical: 10, 
  alignItems: "center" 
},
mapButtonText: { 
  color: "#000000", // negro
  fontSize: 16, 
  fontWeight: "600" 
},

});
