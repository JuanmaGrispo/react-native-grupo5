import React, { useEffect, useState, useCallback, useRef } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { getReservations, cancelReservation } from "../../services/reservationService";
import { getCache, setCache } from "../../utils/cacheService";

const COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  yellow: "#FFD800",
  gray: "#3A3A3A",
  darkerGray: "#222222",
  red: "#FF3B30",
  orange: "#FF9500",
};

const CACHE_KEY = "reservations";
const CACHE_DURATION = 30 * 1000;
const FORCE_REFRESH_DURATION = 2 * 60 * 1000;

const ERROR_TYPES = {
  NO_TOKEN: "NO_TOKEN",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  SERVER_ERROR: "SERVER_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  UNKNOWN: "UNKNOWN",
};

const getErrorType = (error) => {
  if (error?.message === "NO_TOKEN" || error?.message?.includes("token")) {
    return ERROR_TYPES.NO_TOKEN;
  }
  if (error?.code === "ECONNABORTED" || error?.message?.includes("timeout")) {
    return ERROR_TYPES.TIMEOUT;
  }
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return ERROR_TYPES.UNAUTHORIZED;
  }
  if (error?.response?.status === 404) {
    return ERROR_TYPES.NOT_FOUND;
  }
  if (error?.response?.status >= 500) {
    return ERROR_TYPES.SERVER_ERROR;
  }
  if (!error?.response && error?.message) {
    return ERROR_TYPES.NETWORK_ERROR;
  }
  return ERROR_TYPES.UNKNOWN;
};

const getErrorMessage = (errorType, error) => {
  switch (errorType) {
    case ERROR_TYPES.NO_TOKEN:
      return {
        title: "Sesión expirada",
        message: "Tu sesión expiró. Por favor, iniciá sesión nuevamente.",
        showRetry: false,
      };
    case ERROR_TYPES.TIMEOUT:
      return {
        title: "Tiempo de espera agotado",
        message: "La solicitud tardó demasiado. Verificá tu conexión e intentá nuevamente.",
        showRetry: true,
      };
    case ERROR_TYPES.NETWORK_ERROR:
      return {
        title: "Error de conexión",
        message: "No se pudo conectar con el servidor. Verificá tu conexión a internet.",
        showRetry: true,
      };
    case ERROR_TYPES.UNAUTHORIZED:
      return {
        title: "No autorizado",
        message: "Tu sesión expiró o no tenés permisos. Iniciá sesión nuevamente.",
        showRetry: false,
      };
    case ERROR_TYPES.NOT_FOUND:
      return {
        title: "No encontrado",
        message: "No se encontraron reservas. Si creaste una reserva, podés intentar refrescar.",
        showRetry: true,
      };
    case ERROR_TYPES.SERVER_ERROR:
      return {
        title: "Error del servidor",
        message: "El servidor no está disponible en este momento. Intentá más tarde.",
        showRetry: true,
      };
    default:
      return {
        title: "Error al cargar",
        message: "No se pudieron cargar las reservas. Intentá nuevamente.",
        showRetry: true,
      };
  }
};

export default function ReservationsScreen() {
  const navigation = useNavigation();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);
  const [cancelError, setCancelError] = useState(null);

  const isLoadingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  async function fetchReservations(forceRefresh = false) {
    if (isLoadingRef.current && !forceRefresh) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setError(null);

      if (!forceRefresh) {
        const cachedData = await getCache(CACHE_KEY, CACHE_DURATION);
        if (cachedData) {
          setReservations(Array.isArray(cachedData) ? cachedData : []);
          setLoading(false);
          setRefreshing(false);
          isLoadingRef.current = false;
          return;
        }
      }

      if (forceRefresh || !refreshing) {
        setLoading(true);
      }

      const data = await getReservations();
      const reservationsArray = Array.isArray(data) ? data : [];

      await setCache(CACHE_KEY, reservationsArray);
      lastFetchTimeRef.current = Date.now();

      setReservations(reservationsArray);
    } catch (e) {
      const errorType = getErrorType(e);
      const errorInfo = getErrorMessage(errorType, e);

      setError({
        type: errorType,
        ...errorInfo,
      });

      const staleCache = await getCache(CACHE_KEY, FORCE_REFRESH_DURATION);
      if (staleCache) {
        setReservations(Array.isArray(staleCache) ? staleCache : []);
      } else {
        setReservations([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingRef.current = false;
    }
  }

  useEffect(() => {
    fetchReservations(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;

      if (timeSinceLastFetch > FORCE_REFRESH_DURATION || reservations.length === 0) {
        fetchReservations(false);
      } else {
        getCache(CACHE_KEY, CACHE_DURATION).then((cachedData) => {
          if (cachedData) {
            setReservations(Array.isArray(cachedData) ? cachedData : []);
          }
        });
      }
    }, [reservations.length])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    fetchReservations(true);
  }, []);

  const handleCancel = (reservation) => {
    const sessionId = reservation.session?.id || reservation.sessionId || reservation.id;
    const classTitle =
      reservation.session?.classRef?.title ||
      reservation.classTitle ||
      reservation.title ||
      "esta clase";

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
              setCancelError(null);
              await cancelReservation(sessionId);
              Alert.alert("Listo", "Reserva cancelada correctamente.");
              await fetchReservations(true);
            } catch (e) {
              const errorType = getErrorType(e);
              const errorInfo = getErrorMessage(errorType, e);

              setCancelError({
                message: errorInfo.message,
              });

              Alert.alert(
                errorInfo.title || "Error",
                errorInfo.message || "No se pudo cancelar la reserva. Intentá nuevamente."
              );
            } finally {
              setCancelingId(null);
            }
          },
        },
      ]
    );
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
    const session = item.session || {};
    const classRef = session.classRef || {};
    const branch = session.branch || {};
    const sessionId = session.id;
    const reservationStatus = item.status;
    const startAt = session.startAt;
    const dateTime = formatDateTime(startAt);

    const isCanceled = reservationStatus === "CANCELLED" || reservationStatus === "CANCELED" || item.canceledAt;
    const isConfirmed = reservationStatus === "CONFIRMED" || reservationStatus?.toUpperCase() === "CONFIRMED";
    const canCancel = isConfirmed && !isCanceled;

    const locationLabel = branch.name || classRef.locationName;
    const locationDetail = branch.location;
    const instructor = classRef.instructorName;
    const capacityLabel =
      session.capacity !== undefined
        ? `${session.reservedCount || 0} / ${session.capacity}`
        : null;
    const durationLabel = session.durationMin || classRef.defaultDurationMin;

    const infoItems = [];

    if (startAt) {
      infoItems.push({
        icon: "calendar-outline",
        text: `${dateTime.date} · ${dateTime.time}`,
      });
    }

    if (locationLabel) {
      infoItems.push({
        icon: "location-outline",
        text: locationDetail ? `${locationLabel} · ${locationDetail}` : locationLabel,
      });
    }

    if (capacityLabel) {
      infoItems.push({
        icon: "people-outline",
        text: `Reservas: ${capacityLabel}`,
      });
    }

    if (durationLabel) {
      infoItems.push({
        icon: "time-outline",
        text: `Duración: ${durationLabel} min`,
      });
    }

    if (instructor) {
      infoItems.push({
        icon: "person-outline",
        text: `Instructor: ${instructor}`,
      });
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleColumn}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {classRef.title || "Clase sin título"}
            </Text>
            {classRef.discipline && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{classRef.discipline}</Text>
              </View>
            )}
          </View>
          {reservationStatus && (
            <View
              style={[
                styles.statusBadge,
                isCanceled ? styles.statusCanceled : isConfirmed ? styles.statusActive : styles.statusInactive,
              ]}
            >
              <Text style={styles.statusText}>{getStatusLabel(reservationStatus)}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          {infoItems.map((itemInfo, index) => (
            <View key={`${sessionId || ""}-${index}`} style={styles.infoRow}>
              <Ionicons name={itemInfo.icon} size={18} color={COLORS.yellow} style={styles.infoIcon} />
              <Text style={styles.infoText} numberOfLines={1}>
                {itemInfo.text}
              </Text>
            </View>
          ))}
        </View>

        {cancelError && cancelingId === sessionId && (
          <View style={styles.inlineError}>
            <Ionicons name="alert-circle" size={16} color={COLORS.red} style={styles.inlineErrorIcon} />
            <Text style={styles.inlineErrorText}>{cancelError.message}</Text>
          </View>
        )}

        {canCancel && (
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
        )}

        {isCanceled && (
          <View style={styles.canceledInfo}>
            <Ionicons name="close-circle" size={16} color={COLORS.white} style={styles.canceledIcon} />
            <Text style={styles.canceledText}>Esta reserva fue cancelada</Text>
          </View>
        )}
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

  if (error && reservations.length === 0 && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.orange} />
        </View>
        <Text style={styles.errorTitle}>{error.title}</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        {error.showRetry && (
          <TouchableOpacity
            style={[styles.button, styles.buttonYellow, { marginTop: 24 }]}
            onPress={() => {
              setError(null);
              fetchReservations(true);
            }}
          >
            <Text style={styles.buttonTextBlack}>Reintentar</Text>
          </TouchableOpacity>
        )}
        {error.type === ERROR_TYPES.NO_TOKEN || error.type === ERROR_TYPES.UNAUTHORIZED ? (
          <TouchableOpacity
            style={[styles.button, styles.buttonGray, { marginTop: 12 }]}
            onPress={() => {
              navigation.navigate("Login");
            }}
          >
            <Text style={styles.buttonTextWhite}>Ir a Login</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>RitmoFit</Text>
        <Text style={styles.subtitle}>Reservas</Text>
      </View>

      {error && reservations.length > 0 && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            {error.title}: {error.message}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              fetchReservations(true);
            }}
            style={styles.errorBannerButton}
          >
            <Text style={styles.errorBannerButtonText}>Actualizar</Text>
          </TouchableOpacity>
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
            <Ionicons name="calendar-outline" size={64} color={COLORS.gray} />
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
    paddingHorizontal: 32,
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
  errorIconContainer: {
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  errorMessage: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 24,
  },
  errorBanner: {
    backgroundColor: COLORS.orange,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorBannerText: {
    color: COLORS.white,
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  errorBannerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
  },
  errorBannerButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2B2B2B",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  titleColumn: {
    flex: 1,
    marginRight: 12,
    gap: 8,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 24,
  },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 216, 0, 0.15)",
  },
  chipText: {
    color: COLORS.yellow,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: "#4CAF50",
  },
  statusCanceled: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  statusInactive: {
    backgroundColor: COLORS.gray,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    marginTop: 6,
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 10,
    opacity: 0.9,
  },
  infoText: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.85,
    flex: 1,
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
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.25)",
  },
  inlineErrorIcon: {
    marginRight: 8,
  },
  inlineErrorText: {
    color: COLORS.white,
    fontSize: 13,
    flex: 1,
    opacity: 0.85,
  },
  canceledInfo: {
    backgroundColor: COLORS.gray,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
    flexDirection: "row",
    opacity: 0.7,
  },
  canceledIcon: {
    marginRight: 6,
  },
  canceledText: {
    color: COLORS.white,
    fontSize: 14,
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
    textAlign: "center",
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
    fontSize: 16,
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
