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
  Modal,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getMyAttendance } from "../../services/attendanceService";
import { createRating, getMyRatings, getSessionRatings } from "../../services/ratingService";

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

  // Estados para ratings
  const [ratings, setRatings] = useState({}); // Mapa: sessionId -> rating
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showViewRatingModal, setShowViewRatingModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  async function loadHistory() {
    try {
      setError("");
      setLoading(true);
      
      // Cargar historial y ratings en paralelo
      const [attendanceData, ratingsData] = await Promise.all([
        getMyAttendance(),
        getMyRatings().catch(() => []) // Si falla, usar array vacío
      ]);
      
      const attendanceList = Array.isArray(attendanceData) ? attendanceData : [];
      
      // Ordenar por fecha más reciente primero
      attendanceList.sort((a, b) => {
        const dateA = new Date(a.session?.startAt || a.createdAt || 0);
        const dateB = new Date(b.session?.startAt || b.createdAt || 0);
        return dateB - dateA;
      });
      
      // Crear mapa de ratings por sessionId
      const ratingsMap = {};
      if (Array.isArray(ratingsData)) {
        ratingsData.forEach((rating) => {
          if (rating.session?.id) {
            ratingsMap[rating.session.id] = rating;
          }
        });
      }
      
      setRatings(ratingsMap);
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

  // Función de filtrado por rango de fechas (acepta fechas opcionales)
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

      // Si hay fecha de inicio, verificar que la sesión sea >= inicio
      if (start) {
        const startOnly = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate()
        );
        if (sessionDateOnly < startOnly) return false;
      }

      // Si hay fecha de fin, verificar que la sesión sea <= fin
      if (end) {
        const endOnly = new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate()
        );
        if (sessionDateOnly > endOnly) return false;
      }

      return true;
    });
  };

  // Aplicar filtro de fecha
  const applyDateFilter = () => {
    // Validar que haya al menos una fecha
    if (!startDate && !endDate) {
      Alert.alert("Error", "Seleccioná al menos una fecha para filtrar.");
      return;
    }

    // Si hay ambas fechas, validar que inicio <= fin
    if (startDate && endDate && startDate > endDate) {
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

  // Formatear rango de fechas (maneja fechas opcionales)
  const formatDateRange = (start, end) => {
    const formatDate = (date) => {
      if (!date) return "";
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
      return `${day} ${month} ${year}`;
    };

    if (start && end) {
      return `${formatDate(start)} - ${formatDate(end)}`;
    } else if (start) {
      return `Desde ${formatDate(start)}`;
    } else if (end) {
      return `Hasta ${formatDate(end)}`;
    }
    return "";
  };

  // Verificar si una sesión puede ser calificada (dentro de 24 horas)
  const canRateSession = (session) => {
    if (!session?.startAt || !session?.durationMin) return false;
    
    const startAt = new Date(session.startAt);
    const endAt = new Date(startAt.getTime() + session.durationMin * 60 * 1000);
    const deadline = new Date(endAt.getTime() + 24 * 60 * 60 * 1000); // +24 horas
    const now = new Date();
    
    return now <= deadline;
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
          sessionId: session.id,
          session: session, // Guardar la sesión completa para usar en rating
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

  // Permitir aplicar filtro si hay al menos una fecha, y si hay ambas, validar que inicio <= fin
  const canApplyFilter = 
    (startDate !== null || endDate !== null) && 
    (!startDate || !endDate || startDate <= endDate);

  const handleRateSession = (session) => {
    setSelectedSession(session);
    setRatingValue(5);
    setRatingComment("");
    setShowRatingModal(true);
  };

  const handleViewRating = async (sessionId) => {
    try {
      const sessionRatings = await getSessionRatings(sessionId);
      // Buscar la calificación del usuario actual
      const userRating = sessionRatings.find((r) => ratings[sessionId]?.id === r.id) || ratings[sessionId];
      if (userRating) {
        setSelectedRating(userRating);
        setShowViewRatingModal(true);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo cargar la calificación.");
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedSession || !ratingValue) {
      Alert.alert("Error", "Seleccioná una calificación.");
      return;
    }

    try {
      setSubmittingRating(true);
      const newRating = await createRating(
        selectedSession.id,
        ratingValue,
        ratingComment.trim() || undefined
      );
      
      // Actualizar el mapa de ratings
      setRatings((prev) => ({
        ...prev,
        [selectedSession.id]: newRating,
      }));
      
      setShowRatingModal(false);
      setSelectedSession(null);
      setRatingValue(5);
      setRatingComment("");
      Alert.alert("Éxito", "Calificación enviada correctamente.");
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "No se pudo enviar la calificación.";
      Alert.alert("Error", errorMessage);
    } finally {
      setSubmittingRating(false);
    }
  };

  const renderItem = ({ item }) => {
    const sessionRating = item.sessionId ? ratings[item.sessionId] : null;
    const canRate = canRateSession(item.session);
    const hasRating = !!sessionRating;

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          {item.locationName && (
            <Text style={styles.cardLocation}>{item.locationName}</Text>
          )}
        </View>
        <View style={styles.cardBadge}>
          {hasRating ? (
            <TouchableOpacity
              style={styles.viewRatingButton}
              onPress={() => handleViewRating(item.sessionId)}
            >
              <Text style={styles.viewRatingButtonText}>Ver calificación</Text>
            </TouchableOpacity>
          ) : canRate ? (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => handleRateSession(item.session)}
            >
              <Text style={styles.rateButtonText}>Calificar</Text>
            </TouchableOpacity>
          ) : null}
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
            <Text style={styles.dateLabel}>Desde</Text>
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
            <Text style={styles.dateLabel}>Hasta</Text>
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
              canApplyFilter
                ? styles.filterButtonApply
                : styles.filterButtonDisabled,
            ]}
            onPress={applyDateFilter}
            disabled={!canApplyFilter}
          >
            <Text
              style={[
                canApplyFilter
                  ? styles.filterButtonTextActive
                  : styles.filterButtonText,
              ]}
            >
              Aplicar Filtro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              isFilterActive ? styles.filterButtonClearActive : styles.filterButtonClear,
            ]}
            onPress={clearDateFilter}
          >
            <Text
              style={[
                styles.filterButtonText,
                isFilterActive && styles.filterButtonTextActive,
              ]}
            >
              Limpiar
            </Text>
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

      {/* Modal para calificar */}
      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Calificar Clase</Text>
            <Text style={styles.modalSubtitle}>{selectedSession?.classRef?.title || "Clase"}</Text>

            <Text style={styles.modalLabel}>Calificación (1-5 estrellas)</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRatingValue(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= ratingValue ? "star" : "star-outline"}
                    size={40}
                    color={COLORS.yellow}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Comentario (opcional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Escribí tu comentario aquí..."
              placeholderTextColor={COLORS.white + "80"}
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {ratingComment.length}/1000 caracteres
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRatingModal(false);
                  setSelectedSession(null);
                  setRatingValue(5);
                  setRatingComment("");
                }}
                disabled={submittingRating}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, submittingRating && styles.disabledButton]}
                onPress={handleSubmitRating}
                disabled={submittingRating}
              >
                {submittingRating ? (
                  <ActivityIndicator color={COLORS.black} />
                ) : (
                  <Text style={styles.submitButtonText}>Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para ver calificación */}
      <Modal
        visible={showViewRatingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowViewRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mi Calificación</Text>
            {selectedRating && (
              <>
                <View style={styles.ratingDisplayContainer}>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= selectedRating.rating ? "star" : "star-outline"}
                        size={40}
                        color={COLORS.yellow}
                      />
                    ))}
                  </View>
                  {selectedRating.comment && (
                    <View style={styles.commentDisplayContainer}>
                      <Text style={styles.commentLabel}>Comentario:</Text>
                      <Text style={styles.commentText}>{selectedRating.comment}</Text>
                    </View>
                  )}
                  <Text style={styles.ratingDate}>
                    Calificada el {new Date(selectedRating.createdAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowViewRatingModal(false);
                setSelectedRating(null);
              }}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  filterButtonClearActive: {
    backgroundColor: COLORS.yellow,
  },
  filterButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 1,
  },
  filterButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
  filterButtonTextActive: {
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  rateButton: {
    backgroundColor: COLORS.yellow,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  rateButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: "600",
  },
  viewRatingButton: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  viewRatingButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.darkerGray,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  modalTitle: {
    color: COLORS.yellow,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.9,
  },
  modalLabel: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 16,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginVertical: 16,
  },
  starButton: {
    padding: 4,
  },
  commentInput: {
    backgroundColor: COLORS.gray,
    borderRadius: 8,
    padding: 12,
    color: COLORS.white,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#444",
    minHeight: 100,
    marginBottom: 8,
  },
  charCount: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.6,
    textAlign: "right",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.gray,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: COLORS.yellow,
  },
  submitButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  closeButton: {
    backgroundColor: COLORS.yellow,
    marginTop: 16,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: "600",
  },
  ratingDisplayContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  commentDisplayContainer: {
    width: "100%",
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.gray,
    borderRadius: 8,
  },
  commentLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  commentText: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
  },
  ratingDate: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.7,
    marginTop: 16,
  },
});
