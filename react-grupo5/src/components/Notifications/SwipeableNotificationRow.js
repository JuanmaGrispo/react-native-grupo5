import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SWIPE_THRESHOLD = 50; // Más fácil de activar
const ACTION_WIDTH = 70; // Menos distancia para deslizar

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

export default function SwipeableNotificationRow({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onPress,
  getNotificationIcon,
  formatDate,
  children,
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const rowHeight = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const currentX = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Más sensible: activar si el movimiento horizontal es mayor
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8;
      },
      onPanResponderGrant: () => {
        translateX.setOffset(currentX.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;
        const newX = currentX.current + dx;
        const maxSwipe = -ACTION_WIDTH * 2;

        // Limitar el deslizamiento
        if (newX < maxSwipe) {
          // Resistencia suave cuando excede el máximo
          const excess = Math.abs(newX) - Math.abs(maxSwipe);
          translateX.setValue(maxSwipe - currentX.current - excess * 0.3);
        } else if (newX > 0) {
          // No permitir deslizar a la derecha más allá de 0
          translateX.setValue(-currentX.current);
        } else {
          translateX.setValue(dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();
        const { dx, vx } = gestureState;
        const newX = currentX.current + dx;

        // Considerar velocidad del gesto
        const velocityThreshold = 0.3;
        const shouldOpen = newX < -SWIPE_THRESHOLD || (newX < -20 && vx < -velocityThreshold);
        const shouldClose = newX > -SWIPE_THRESHOLD / 2 || (vx > velocityThreshold && newX > -30);

        if (shouldOpen && !shouldClose) {
          // Abrir acciones
          currentX.current = -ACTION_WIDTH * 2;
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH * 2,
            useNativeDriver: false,
            tension: 70,
            friction: 9,
            velocity: vx || 0,
          }).start();
        } else {
          // Cerrar
          currentX.current = 0;
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 70,
            friction: 9,
            velocity: vx || 0,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Animated.parallel([
      Animated.timing(rowHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onDelete(notification.id);
    });
  };

  const handleToggleRead = () => {
    if (notification.read) {
      onMarkAsUnread(notification.id);
    } else {
      onMarkAsRead(notification.id);
    }
    // Cerrar acciones
    currentX.current = 0;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      tension: 70,
      friction: 9,
    }).start();
  };

  const closeActions = () => {
    currentX.current = 0;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      tension: 70,
      friction: 9,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: rowHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 100],
          }),
          opacity,
        },
      ]}
    >
      {/* Acciones de fondo */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.readAction]}
          onPress={handleToggleRead}
          activeOpacity={0.8}
        >
          <Ionicons
            name={notification.read ? "mail-unread" : "mail"}
            size={22}
            color={COLORS.white}
          />
          <Text style={styles.actionText}>
            {notification.read ? "No leída" : "Leída"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteAction]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={22} color={COLORS.white} />
          <Text style={styles.actionText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido principal */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            styles.notificationItem,
            !notification.read && styles.unreadItem,
          ]}
          onPress={() => {
            if (currentX.current < -10) {
              closeActions();
            } else {
              onPress(notification);
            }
          }}
          activeOpacity={0.7}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    overflow: "hidden",
  },
  actionsContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    width: ACTION_WIDTH * 2,
  },
  actionButton: {
    width: ACTION_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  readAction: {
    backgroundColor: COLORS.blue,
  },
  deleteAction: {
    backgroundColor: COLORS.red,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  contentContainer: {
    backgroundColor: "transparent",
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: COLORS.darkerGray,
    borderRadius: 12,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    minHeight: 80,
  },
  unreadItem: {
    backgroundColor: "#1a1a2e",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue,
  },
});
