import { useState, useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import {
  getUnreadNotifications,
  getAllNotifications,
  markAsRead as markNotificationAsRead,
  markAllAsRead as markAllNotificationsAsRead,
  markAsUnread as markNotificationAsUnread,
  deleteNotification as deleteNotificationService,
} from "../services/notificationService";

const BACKGROUND_FETCH_TASK = "background-notification-fetch";
const POLLING_INTERVAL = 15 * 60 * 1000; // 15 minutos

// Configurar cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Definir la tarea de background
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const notifications = await getUnreadNotifications();

    // Mostrar notificaciones locales para las nuevas
    for (const notification of notifications) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: { notificationId: notification.id },
          sound: true,
        },
        trigger: null, // Inmediata
      });
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background fetch error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const previousCountRef = useRef(0);

  const fetchNotifications = useCallback(async () => {
    try {
      // Obtener todas las notificaciones (leídas y no leídas)
      const allNotifications = await getAllNotifications();
      
      // Calcular el conteo de no leídas
      const unreadNotifications = allNotifications.filter((n) => !n.read);
      const unreadCountValue = unreadNotifications.length;
      
      setNotifications(allNotifications);
      setUnreadCount(unreadCountValue);

      // Mostrar notificaciones locales si hay nuevas no leídas
      const previousCount = previousCountRef.current;
      if (unreadCountValue > previousCount && previousCount > 0) {
        const newUnreadNotifications = unreadNotifications.slice(
          0,
          unreadCountValue - previousCount
        );
        for (const notification of newUnreadNotifications) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title,
              body: notification.body,
              data: { notificationId: notification.id },
            },
            trigger: null,
          });
        }
      }
      previousCountRef.current = unreadCountValue;
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Solicitar permisos de notificaciones
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("Notification permissions not granted");
      }
    };
    requestPermissions();

    // Registrar background task
    const registerBackgroundTask = async () => {
      try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 15 * 60, // 15 minutos en segundos
          stopOnTerminate: false,
          startOnBoot: true,
        });
      } catch (error) {
        console.error("Error registering background task:", error);
      }
    };
    registerBackgroundTask();

    // Cargar notificaciones inmediatamente
    fetchNotifications();

    // Configurar polling cuando la app está activa
    intervalRef.current = setInterval(() => {
      if (appState.current === "active") {
        fetchNotifications();
      }
    }, POLLING_INTERVAL);

    // Escuchar cambios de estado de la app
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App viene al foreground, actualizar notificaciones
        fetchNotifications();
      }
      appState.current = nextAppState;
    });

    // Limpiar al desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, []);

  const markAsUnread = useCallback(async (notificationId) => {
    try {
      await markNotificationAsUnread(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error marking notification as unread:", error);
      // Si el endpoint no existe, lo hacemos localmente
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await deleteNotificationService(notificationId);
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === notificationId);
        const newNotifications = prev.filter((n) => n.id !== notificationId);
        if (notification && !notification.read) {
          setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
        }
        return newNotifications;
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      // Si el endpoint no existe, lo eliminamos localmente
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === notificationId);
        const newNotifications = prev.filter((n) => n.id !== notificationId);
        if (notification && !notification.read) {
          setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
        }
        return newNotifications;
      });
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
};

