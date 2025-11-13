import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getMyAttendance } from "../../services/attendanceService";

const COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  yellow: "#FFD800",
  gray: "#3A3A3A",
  darkerGray: "#222222",
  red: "#FF3B30",
};

export default function HistorialScreen() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Estados para filtros de fecha
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [startDateText, setStartDateText] = useState("");
  const [endDateText, setEndDateText] = useState("");

  async function loadHistory() {
    try {
      setError("");
      setLoading(true);
      const data = await getMyAttendance();
      const attendanceList = Array.isArray(data) ? data : [];
      
      // Ordenar por fecha más reciente primero
      attendanceList.sort((a, b) => {
        const dateA = new Date(a.session?.startAt || a.createdAt || 0);
        const dateB = new Date(b.session?.startAt || b.createdAt || 0);
        return dateB - dateA;
      });
      
      setAttendanceData(attendanceList);
      setFilteredData(attendanceList);
    } catch (e) {
      if (e?.response?.status === 401) {
        setError("Sesión expirada. Iniciá sesión de nuevo.");
      } else if (e?.message === "NO_TOKEN") {
        setError("Sesión no iniciada. Iniciá sesión.");
      } else {
        setError(`No se pudo cargar el historial: ${e?.message || "Error desconocido"}`);
      }
      setAttendanceData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  // Refrescar cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, []);

  // Función para parsear fechas ISO
  const parseDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString);
    } catch (e) {
      return null;
    }
  };

  // Función de filtrado por rango de fechas
  const filterByDateRange = (data, start, end) => {
    return data.filter((dto) => {
      if (!dto.session?.startAt) return false;

      const sessionDate = parseDate(dto.session.startAt);
      if (!sessionDate) return false;

      // Comparar solo las fechas (sin hora)
      const sessionDateOnly = new Date(
        sessionDate.getFullYear(),
        sessionDate.getMonth(),
        sessionDate.getDate()
      );
      const startOnly = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );
      const endOnly = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      );

      return sessionDateOnly >= startOnly && sessionDateOnly <= endOnly;
    });
  };

  // Aplicar filtro de fecha
  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      Alert.alert("Error", "Seleccioná ambas fechas para filtrar.");
      return;
    }
    if (startDate > endDate) {
      Alert.alert("Error", "La fecha de inicio debe ser anterior a la fecha de fin.");
      return;
    }

    setIsFilterActive(true);
    const filtered = filterByDateRange(attendanceData, startDate, endDate);
    setFilteredData(filtered);
  };

  // Limpiar filtro
  const clearDateFilter = () => {
    setIsFilterActive(false);
    setStartDate(null);
    setEndDate(null);
    setStartDateText("");
    setEndDateText("");
    setFilteredData(attendanceData);
  };

  // Formatear fecha para UI: "dd/MM - HH:mm hs"
  const formatDateForUI = (isoDate) => {
    if (!isoDate) return "";

    try {
      const date = new Date(isoDate);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${day}/${month} - ${hours}:${minutes} hs`;
    } catch (e) {
      return isoDate;
    }
  };

  // Formatear fecha para mostrar en el input
  const formatDateForInput = (date) => {
    if (!date) return "";
    try {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "";
    }
  };

  // Formatear rango de fechas
  const formatDateRange = (start, end) => {
    const formatDate = (date) => {
      const day = date.getDate();
      const monthNames = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month}${date === end ? ` ${year}` : ""}`;
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Transformar datos a formato UI
  const transformToHistoryItems = (data) => {
    return data
      .filter((dto) => dto.session !== null)
      .map((dto) => {
        const session = dto.session;
        const classRef = session.classRef || {};

        const title = classRef.title || "Clase";
        const dateUi = formatDateForUI(session.startAt);
        const teacher = classRef.instructorName || "";
        const locationName = classRef.locationName || "";
        const durationMin = session.durationMin || 0;

        // Este endpoint representa asistencias efectivas -> siempre "Asistida"
        const attended = true;

        const subtitle = `${dateUi}${durationMin > 0 ? ` • ${durationMin} min` : ""}`;

        return {
          id: dto.id || session.id,
          title,
          subtitle,
          teacher,
          locationName,
          durationMin,
          attended,
        };
      });
  };

  // Parsear fecha desde texto dd/MM/yyyy
  const parseDateFromText = (text) => {
    if (!text) return null;
    const parts = text.split("/");
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Mes es 0-indexed
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const date = new Date(year, month, day);
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null; // Fecha inválida
    }
    return date;
  };

  // Validar y establecer fecha desde texto
  const handleStartDateTextChange = (text) => {
    setStartDateText(text);
    const date = parseDateFromText(text);
    if (date) {
      const maxDate = new Date();
      maxDate.setHours(23, 59, 59, 999);
      if (date > maxDate) {
        Alert.alert("Error", "No se pueden seleccionar fechas futuras.");
        return;
      }
      setStartDate(date);
    } else if (text === "") {
      setStartDate(null);
    }
  };

  const handleEndDateTextChange = (text) => {
    setEndDateText(text);
    const date = parseDateFromText(text);
    if (date) {
      const maxDate = new Date();
      maxDate.setHours(23, 59, 59, 999);
      if (date > maxDate) {
        Alert.alert("Error", "No se pueden seleccionar fechas futuras.");
        return;
      }
      setEndDate(date);
    } else if (text === "") {
      setEndDate(null);
    }
  };

  const canApplyFilter = startDate !== null && endDate !== null && startDate <= endDate;

  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          {item.locationName && (
            <Text style={styles.cardLocation}>{item.locationName}</Text>
          )}
          {item.durationMin > 0 && (
            <Text style={styles.cardDuration}>{item.durationMin} min</Text>
          )}
        </View>
        <View style={styles.cardBadge}>
          <View style={[styles.badge, styles.badgeAttended]}>
            <Text style={styles.badgeText}>Asistida</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.yellow} />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  if (error && attendanceData.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonYellow]}
          onPress={loadHistory}
        >
          <Text style={styles.buttonTextBlack}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = transformToHistoryItems(filteredData);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>RitmoFit</Text>
        <Text style={styles.subtitle}>Historial</Text>
      </View>

      {/* Sección de filtros de fecha */}
      <View style={styles.dateFiltersSection}>
        <View style={styles.dateFilters}>
          <View style={styles.dateFilterItem}>
            <Text style={styles.dateLabel}>Desde (dd/MM/yyyy)</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="dd/MM/yyyy"
              placeholderTextColor={COLORS.white + "80"}
              value={startDateText}
              onChangeText={handleStartDateTextChange}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.dateFilterItem}>
            <Text style={styles.dateLabel}>Hasta (dd/MM/yyyy)</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="dd/MM/yyyy"
              placeholderTextColor={COLORS.white + "80"}
              value={endDateText}
              onChangeText={handleEndDateTextChange}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>

        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              styles.filterButtonApply,
              !canApplyFilter && styles.filterButtonDisabled,
            ]}
            onPress={applyDateFilter}
            disabled={!canApplyFilter}
          >
            <Text style={styles.filterButtonText}>Aplicar Filtro</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, styles.filterButtonClear]}
            onPress={clearDateFilter}
          >
            <Text style={styles.filterButtonText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        {/* Información del filtro activo */}
        {isFilterActive && (
          <View style={styles.filterInfo}>
            <Text style={styles.filterInfoText}>
              Mostrando: {items.length} actividades
            </Text>
            <Text style={styles.filterInfoText}>
              {formatDateRange(startDate, endDate)}
            </Text>
          </View>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {refreshing && (
        <View style={styles.refreshingOverlay}>
          <ActivityIndicator size="large" color={COLORS.yellow} />
          <Text style={styles.refreshingText}>Actualizando historial...</Text>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isFilterActive
                ? "No hay actividades en el rango seleccionado"
                : "Sin historial por ahora."}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.yellow}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 49,
    paddingBottom: 24,
  },
  title: {
    color: COLORS.yellow,
    fontSize: 42,
    textAlign: "center",
    fontWeight: "700",
  },
  subtitle: {
    color: COLORS.white,
    fontSize: 22,
    textAlign: "center",
    marginTop: 8,
  },
  dateFiltersSection: {
    backgroundColor: COLORS.darkerGray,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  dateFilters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  dateFilterItem: {
    flex: 1,
  },
  dateLabel: {
    color: COLORS.white,
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.8,
  },
  dateInput: {
    backgroundColor: COLORS.gray,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#444",
    color: COLORS.white,
    fontSize: 14,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonApply: {
    backgroundColor: COLORS.yellow,
  },
  filterButtonClear: {
    backgroundColor: COLORS.gray,
  },
  filterButtonDisabled: {
    opacity: 0.5,
  },
  filterButtonText: {
    color: COLORS.black,
    fontWeight: "700",
    fontSize: 14,
  },
  filterInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#444",
  },
  filterInfoText: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.8,
  },
  errorBanner: {
    backgroundColor: COLORS.red,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 8,
  },
  errorBannerText: {
    color: COLORS.white,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.darkerGray,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardSubtitle: {
    color: COLORS.white,
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 2,
  },
  cardLocation: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  cardDuration: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  cardBadge: {
    display: "flex",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeAttended: {
    backgroundColor: COLORS.yellow,
  },
  badgeText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.white,
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    minWidth: 120,
    marginTop: 16,
  },
  buttonYellow: {
    backgroundColor: COLORS.yellow,
  },
  buttonTextBlack: {
    color: COLORS.black,
    fontWeight: "700",
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.white,
  },
  errorText: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  refreshingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    marginTop: 120,
  },
  refreshingText: {
    color: COLORS.white,
    marginTop: 8,
    fontSize: 14,
  },
});
