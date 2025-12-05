import React, { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Camera } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import RootStack from "./src/navigation";
import { AuthProvider, useAuth } from "./src/context/AuthContext";

const PERMISSIONS_KEY = "permissions_requested";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppContent() {
  const { isAuthenticated } = useAuth(); // ✅ usamos isAuthenticated en lugar de user
  const navigationRef = useRef(null);
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    const setupPermissionsAndNotifications = async () => {
      try {
        const alreadyRequested = await AsyncStorage.getItem(PERMISSIONS_KEY);

        // ✅ Solo si el usuario inició sesión y no se pidieron antes
        if (!alreadyRequested && isAuthenticated) {
          const notifStatus = await Notifications.requestPermissionsAsync();
          const camStatus = await Camera.requestCameraPermissionsAsync();

          if (
            notifStatus.status !== "granted" ||
            camStatus.status !== "granted"
          ) {
            Alert.alert(
              "Permisos requeridos",
              "Para usar todas las funciones del gimnasio, habilitá las notificaciones y la cámara."
            );
          }

          if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
              name: "default",
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: "#FF231F7C",
            });
          }

          await AsyncStorage.setItem(PERMISSIONS_KEY, "true"); //  Guardamos que ya se pidió
        }
      } catch (error) {
        console.error("Error configurando permisos:", error);
      }
    };

    setupPermissionsAndNotifications();
  }, [isAuthenticated]); // 👈 se ejecuta cuando el usuario inicia o cierra sesión

  // Configurar listeners de notificaciones
  useEffect(() => {
    if (!isAuthenticated) return;

    // Cuando se recibe una notificación en foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    // Cuando el usuario toca una notificación
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        // Navegar a la pantalla de notificaciones
        if (navigationRef.current) {
          navigationRef.current.navigate("MainTabs", {
            screen: "Notifications",
          });
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated]);

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
