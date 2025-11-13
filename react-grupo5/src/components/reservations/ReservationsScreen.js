import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getReservations, cancelReservation } from "../../services/reservationService";

const COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  yellow: "#FFD800",
  gray: "#3A3A3A",
  darkerGray: "#222222",
  red: "#FF3B30",
};

export default function ReservationsScreen() {
  const navigation = useNavigation();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);

  async function fetchReservations() {
    try {
      setError("");
      setLoading(true);
      const data = await getReservations();
      // Asegurarse de que sea un array
      setReservations(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg =
        e?.message === "NO_TOKEN"
          ? "Sesión expirada. Iniciá sesión nuevamente."
          : "No se pudieron cargar las reservas";
      setError(msg);
      setReservations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchReservations();
  }, []);

  // Refrescar cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      fetchReservations();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReservations();
  }, []);

  const handleCancel = (reservation) => {
    const sessionId = reservation.session?.id || reservation.sessionId || reservation.id;
    const classTitle = reservation.session?.classRef?.title || reservation.classTitle || reservation.title || "esta clase";
    Alert.alert(
      "Cancelar reserva",
      `¿Estás seguro de que querés cancelar la reserva de "${classTitle}"?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              setCancelingId(sessionId);
              await cancelReservation(sessionId);
              Alert.alert("Listo", "Reserva cancelada correctamente.");
              // Refrescar la lista
              await fetchReservations();
            } catch (e) {
              Alert.alert(
                "Error",
                "No se pudo cancelar la reserva. Intentá nuevamente."
              );
            } finally {
              setCancelingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: "—", time: "—" };
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        time: date.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch {
      return { date: dateString, time: "—" };
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return "Desconocido";
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case "CONFIRMED":
        return "Confirmada";
      case "CANCELLED":
      case "CANCELED":
        return "Cancelada";
      case "PENDING":
        return "Pendiente";
      default:
        return status;
    }
  };

  const renderItem = ({ item }) => {
    // Mapear la estructura real del backend
    const session = item.session || {};
    const classRef = session.classRef || {};
    const branch = session.branch || {};
    const sessionId = session.id;
    const reservationStatus = item.status;
    const startAt = session.startAt;
    const dateTime = formatDateTime(startAt);

    // Determinar si se puede cancelar (solo si está CONFIRMED y no cancelada)
    const canCancel =
      (reservationStatus === "CONFIRMED" || reservationStatus?.toUpperCase() === "CONFIRMED") && 
      !item.canceledAt;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {classRef.title || "Clase sin título"}
          </Text>
          {reservationStatus && (
            <View
              style={[
                styles.statusBadge,
                reservationStatus === "CONFIRMED"
                  ? styles.statusActive
                  : styles.statusInactive,
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusLabel(reservationStatus)}
              </Text>
            </View>
          )}
        </View>

        {classRef.discipline && (
          <Text style={styles.cardText}>
            Disciplina: {classRef.discipline}
          </Text>
        )}
        {classRef.instructorName && (
          <Text style={styles.cardText}>
            Profesor: {classRef.instructorName}
          </Text>
        )}
        {(branch.name || classRef.locationName) && (
          <Text style={styles.cardText}>
            Ubicación: {branch.name || classRef.locationName}
            {branch.location && ` - ${branch.location}`}
          </Text>
        )}
        {startAt && (
          <>
            <Text style={styles.cardText}>Fecha: {dateTime.date}</Text>
            <Text style={styles.cardText}>Hora: {dateTime.time}</Text>
          </>
        )}
        {(session.durationMin || classRef.defaultDurationMin) && (
          <Text style={styles.cardText}>
            Duración: {session.durationMin || classRef.defaultDurationMin} min
          </Text>
        )}
        {session.capacity && (
          <Text style={styles.cardText}>
            Cupos: {session.reservedCount || 0}/{session.capacity}
          </Text>
        )}

        {/* Botón de cancelar - siempre visible para reservas confirmadas */}
        {canCancel ? (
          <TouchableOpacity
            style={[
              styles.cancelButton,
              cancelingId === sessionId && styles.cancelButtonDisabled,
            ]}
            onPress={() => handleCancel(item)}
            disabled={cancelingId === sessionId}
            activeOpacity={0.7}
          >
            {cancelingId === sessionId ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
            )}
          </TouchableOpacity>
        ) : reservationStatus === "CONFIRMED" || reservationStatus?.toUpperCase() === "CONFIRMED" ? (
          // Si está confirmada pero no se puede cancelar (ya cancelada), mostrar mensaje
          <View style={styles.canceledInfo}>
            <Text style={styles.canceledText}>Reserva cancelada</Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.yellow} />
        <Text style={styles.loadingText}>Cargando reservas...</Text>
      </View>
    );
  }

  if (error && reservations.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonYellow]}
          onPress={fetchReservations}
        >
          <Text style={styles.buttonTextBlack}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>RitmoFit</Text>
        <Text style={styles.subtitle}>Mis Reservas</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {refreshing && (
        <View style={styles.refreshingOverlay}>
          <ActivityIndicator size="large" color={COLORS.yellow} />
          <Text style={styles.refreshingText}>Actualizando reservas...</Text>
        </View>
      )}

      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id?.toString() || item.session?.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tenés reservas aún</Text>
            <Text style={styles.emptySubtext}>
              Reservá clases desde la pantalla principal
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: "#4CAF50",
  },
  statusInactive: {
    backgroundColor: COLORS.gray,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  cardText: {
    color: COLORS.white,
    fontSize: 14,
    marginBottom: 6,
    opacity: 0.9,
  },
  cancelButton: {
    backgroundColor: COLORS.red,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  canceledInfo: {
    backgroundColor: COLORS.gray,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  canceledText: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.7,
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.7,
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    minWidth: 120,
  },
  buttonYellow: {
    backgroundColor: COLORS.yellow,
  },
  buttonGray: {
    backgroundColor: COLORS.gray,
  },
  buttonTextBlack: {
    color: COLORS.black,
    fontWeight: "700",
  },
  buttonTextWhite: {
    color: COLORS.white,
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
    marginTop: 120, // Debajo del header
  },
  refreshingText: {
    color: COLORS.white,
    marginTop: 8,
    fontSize: 14,
  },
});

