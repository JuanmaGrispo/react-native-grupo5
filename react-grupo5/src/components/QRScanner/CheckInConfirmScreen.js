import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { checkInByQR } from "../../services/attendanceService";

const COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  yellow: "#FFD800",
  gray: "#3A3A3A",
  darkerGray: "#222222",
  red: "#FF3B30",
  green: "#4CAF50",
};

export default function CheckInConfirmScreen({ route, navigation }) {
  const { sessionData, qrData } = route.params;
  const [loading, setLoading] = useState(false);

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

  const handleConfirm = async () => {
    Alert.alert(
      "Confirmar check-in",
      `¿Confirmás tu ingreso a "${sessionData.class.title}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setLoading(true);
              await checkInByQR(sessionData.sessionId);

              Alert.alert(
                "¡Check-in exitoso!",
                "Tu ingreso fue registrado correctamente.",
                [
                  {
                    text: "Aceptar",
                    onPress: () => {
                      // Navegar de vuelta y refrescar datos si es necesario
                      navigation.navigate("MainTabs", { screen: "Reservations" });
                    },
                  },
                ]
              );
            } catch (error) {
              let errorMessage =
                "No se pudo completar el check-in. Intentá nuevamente.";

              if (error?.response?.status === 400) {
                errorMessage =
                  error?.response?.data?.message ||
                  "No podés hacer check-in en este momento. Verificá que tengas una reserva activa.";
              } else if (error?.response?.status === 401) {
                errorMessage = "Tu sesión expiró. Por favor, iniciá sesión nuevamente.";
              } else if (error?.response?.status === 409) {
                errorMessage = "Ya realizaste el check-in para esta sesión.";
              }

              Alert.alert("Error", errorMessage);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const startDateTime = formatDateTime(sessionData.schedule?.startAt);
  const endDateTime = formatDateTime(sessionData.schedule?.endAt);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar Check-in</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Card principal */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.classTitle} numberOfLines={2}>
              {sessionData.class?.title || "Clase"}
            </Text>
            {sessionData.class?.discipline && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {sessionData.class.discipline}
                </Text>
              </View>
            )}
          </View>

          {/* Información del turno */}
          <View style={styles.infoSection}>
            {/* Horario */}
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.yellow}
                style={styles.infoIcon}
              />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Fecha y hora</Text>
                <Text style={styles.infoText}>
                  {startDateTime.date} · {startDateTime.time}
                </Text>
                {endDateTime.time !== "—" && (
                  <Text style={styles.infoSubtext}>
                    Hasta: {endDateTime.time}
                  </Text>
                )}
              </View>
            </View>

            {/* Duración */}
            {sessionData.schedule?.durationMin && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={COLORS.yellow}
                  style={styles.infoIcon}
                />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Duración</Text>
                  <Text style={styles.infoText}>
                    {sessionData.schedule.durationMin} minutos
                  </Text>
                </View>
              </View>
            )}

            {/* Sede */}
            {sessionData.branch && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={COLORS.yellow}
                  style={styles.infoIcon}
                />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Sede</Text>
                  <Text style={styles.infoText}>
                    {sessionData.branch.name}
                  </Text>
                  {sessionData.branch.location && (
                    <Text style={styles.infoSubtext}>
                      {sessionData.branch.location}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Instructor */}
            {sessionData.class?.instructorName && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.yellow}
                  style={styles.infoIcon}
                />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Instructor</Text>
                  <Text style={styles.infoText}>
                    {sessionData.class.instructorName}
                  </Text>
                </View>
              </View>
            )}

            {/* Estado */}
            {sessionData.status && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={COLORS.yellow}
                  style={styles.infoIcon}
                />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Estado</Text>
                  <Text style={styles.infoText}>
                    {sessionData.status === "SCHEDULED"
                      ? "Programada"
                      : sessionData.status === "IN_PROGRESS"
                      ? "En curso"
                      : sessionData.status}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Mensaje informativo */}
        <View style={styles.messageContainer}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.yellow} />
          <Text style={styles.messageText}>
            Verificá que los datos sean correctos antes de confirmar tu ingreso.
          </Text>
        </View>
      </ScrollView>

      {/* Botón de confirmación */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.black} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.black} />
              <Text style={styles.confirmButtonText}>Confirmar Check-in</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkerGray,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2B2B2B",
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 20,
  },
  classTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 216, 0, 0.15)",
  },
  chipText: {
    color: COLORS.yellow,
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  infoSubtext: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 216, 0, 0.1)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 216, 0, 0.2)",
  },
  messageText: {
    color: COLORS.white,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    opacity: 0.9,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: COLORS.black,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkerGray,
  },
  confirmButton: {
    backgroundColor: COLORS.yellow,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: COLORS.black,
    fontSize: 18,
    fontWeight: "700",
  },
});

