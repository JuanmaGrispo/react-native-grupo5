import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "../../hooks/useNotifications";
import { getAllNotifications } from "../../services/notificationService";
import SwipeableNotificationRow from "./SwipeableNotificationRow";

const COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  yellow: "#FFD800",
  gray: "#3A3A3A",
  darkerGray: "#222222",
  red: "#FF3B30",
  blue: "#2196F3",
  green: "#34C759",
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "SESSION_CANCELED":
      return "❌";
    case "SESSION_RESCHEDULED":
      return "🔄";
    case "SESSION_REMINDER":
      return "⏰";
    default:
      return "🔔";
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case "SESSION_CANCELED":
      return COLORS.red;
    case "SESSION_RESCHEDULED":
      return COLORS.blue;
    case "SESSION_REMINDER":
      return COLORS.yellow;
    default:
      return COLORS.blue;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    return dateString;
  }
};

export default function NotificationScreen() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [testing, setTesting] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleNotificationPress = (notification) => {
    // No hacer nada automáticamente al tocar
    // El usuario puede usar swipe actions para marcar como leída/no leída
  };

  const handleDelete = (notificationId) => {
    Alert.alert(
      "Eliminar notificación",
      "¿Estás seguro de que querés eliminar esta notificación?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteNotification(notificationId),
        },
      ]
    );
  };

  // Función para probar notificaciones llamando directamente al backend
  const testNotifications = async () => {
    try {
      setTesting(true);
      const allNotifications = await getAllNotifications();
      const unreadNotifications = allNotifications.filter((n) => !n.read);

      Alert.alert(
        "✅ Prueba completada",
        `Se consultó el backend.\n\nTotal: ${allNotifications.length} notificación(es)\nNo leídas: ${unreadNotifications.length}`
      );

      await refresh();
    } catch (error) {
      console.error("Error al probar notificaciones:", error);
      Alert.alert(
        "Error",
        "No se pudo consultar el backend. Verifica tu conexión."
      );
    } finally {
      setTesting(false);
    }
  };

  const renderItem = ({ item }) => {
    const iconColor = getNotificationColor(item.type);
    // Obtener el nombre de la clase desde diferentes posibles ubicaciones
    const className = 
      item.className || 
      item.session?.classRef?.title || 
      item.session?.className ||
      "Clase";

    return (
      <SwipeableNotificationRow
        notification={item}
        onMarkAsRead={markAsRead}
        onMarkAsUnread={markAsUnread}
        onDelete={handleDelete}
        onPress={handleNotificationPress}
        getNotificationIcon={getNotificationIcon}
        formatDate={formatDate}
      >
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: iconColor + "20" }]}>
            <Text style={[styles.icon, { color: iconColor }]}>
              {getNotificationIcon(item.type)}
            </Text>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.className,
                  !item.read && styles.unreadClassName,
                ]}
                numberOfLines={1}
              >
                {className}
              </Text>
              <Text
                style={[
                  styles.title,
                  !item.read && styles.unreadTitle,
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
            </View>
            {!item.read && <View style={styles.unreadBadge} />}
          </View>
          <Text style={styles.body} numberOfLines={3}>
            {item.body}
          </Text>
          <View style={styles.footerRow}>
            <View style={styles.dateContainer}>
              <Ionicons
                name="time-outline"
                size={12}
                color={COLORS.white}
                style={{ opacity: 0.5, marginRight: 4 }}
              />
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            </View>
            {item.session?.branch?.name && (
              <View style={styles.locationContainer}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={COLORS.white}
                  style={{ opacity: 0.5, marginRight: 4 }}
                />
                <Text style={styles.location} numberOfLines={1}>
                  {item.session.branch.name}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.white}
            style={{ opacity: 0.3 }}
          />
        </View>
      </SwipeableNotificationRow>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.yellow} />
        <Text style={styles.loadingText}>Cargando notificaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.mainTitle}>RitmoFit</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.subTitle}>Notificaciones</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.testButton, testing && styles.testButtonDisabled]}
            onPress={testNotifications}
            disabled={testing}
          >
            <Ionicons
              name="refresh"
              size={16}
              color={COLORS.black}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.testButtonText}>
              {testing ? "Probando..." : "Probar Notis"}
            </Text>
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={markAllAsRead}
            >
              <Ionicons
                name="checkmark-done"
                size={16}
                color={COLORS.black}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.markAllButtonText}>Marcar todas</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color={COLORS.white}
            style={{ opacity: 0.3, marginBottom: 16 }}
          />
          <Text style={styles.emptyText}>No tienes notificaciones</Text>
          <Text style={styles.emptySubtext}>
            Las notificaciones aparecerán aquí cuando haya novedades
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications.sort((a, b) => {
            // Ordenar: no leídas primero, luego por fecha (más recientes primero)
            if (a.read !== b.read) {
              return a.read ? 1 : -1;
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
          })}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.yellow}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 49,
    paddingBottom: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  mainTitle: {
    color: COLORS.yellow,
    fontSize: 42,
    textAlign: "center",
    fontWeight: "700",
  },
  headerBadge: {
    marginLeft: 12,
    backgroundColor: COLORS.red,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  subTitle: {
    color: COLORS.white,
    fontSize: 22,
    textAlign: "center",
    marginTop: 8,
    opacity: 0.9,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  testButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.yellow,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: "700",
  },
  markAllButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.yellow,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  markAllButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: "700",
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  titleContainer: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.yellow,
    marginBottom: 4,
    opacity: 0.9,
  },
  unreadClassName: {
    opacity: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
    opacity: 0.8,
  },
  unreadTitle: {
    fontWeight: "700",
    opacity: 1,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.blue,
    marginLeft: 8,
    marginTop: 6,
  },
  body: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 8,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  date: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.5,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  location: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.5,
    flex: 1,
  },
  chevronContainer: {
    justifyContent: "center",
    paddingLeft: 8,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.white,
    fontSize: 16,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.5,
    textAlign: "center",
  },
});
