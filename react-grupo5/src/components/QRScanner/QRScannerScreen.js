import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { scanQR } from "../../services/attendanceService";

const COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  yellow: "#FFD800",
  gray: "#3A3A3A",
  darkerGray: "#222222",
  red: "#FF3B30",
  green: "#4CAF50",
};

export default function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Solicitar permisos si no están otorgados
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        "Permisos de cámara",
        "Necesitamos acceso a la cámara para escanear el código QR. Por favor, habilitá los permisos en la configuración de la app.",
        [
          { text: "Cancelar", style: "cancel", onPress: () => navigation.goBack() },
          { text: "Abrir configuración", onPress: () => {} },
        ]
      );
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || loading) return; // Evitar múltiples escaneos

    setScanned(true);
    setLoading(true);

    try {
      // Llamar al endpoint para validar el QR y obtener datos del turno
      const sessionData = await scanQR(data);

      // Navegar a la pantalla de confirmación con los datos
      navigation.navigate("CheckInConfirm", {
        sessionData,
        qrData: data,
      });
    } catch (error) {
      let errorMessage = "No se pudo validar el código QR. Intentá nuevamente.";

      if (error?.response?.status === 404) {
        errorMessage = "Sesión no encontrada. Verificá que el código QR sea válido.";
      } else if (error?.response?.status === 400) {
        errorMessage =
          error?.response?.data?.message ||
          "La sesión no admite check-in en este momento.";
      } else if (error?.response?.status === 401) {
        errorMessage = "Tu sesión expiró. Por favor, iniciá sesión nuevamente.";
      }

      Alert.alert("Error", errorMessage, [
        {
          text: "Reintentar",
          onPress: () => {
            setScanned(false);
            setLoading(false);
          },
        },
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => navigation.goBack(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.yellow} />
        <Text style={styles.loadingText}>Verificando permisos...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={COLORS.yellow} />
          <Text style={styles.permissionTitle}>Permiso de cámara requerido</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a tu cámara para escanear el código QR del gimnasio.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Conceder permiso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned || loading ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Escanear QR</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Instrucciones */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Apuntá la cámara al código QR del molinete o recepción
            </Text>
          </View>

          {/* Marco de escaneo */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* Loading overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.yellow} />
              <Text style={styles.loadingText}>Validando código...</Text>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  instructionsContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 20,
  },
  instructionsText: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scanFrame: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 60,
    marginVertical: 100,
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: COLORS.yellow,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  permissionTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: COLORS.yellow,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
    marginBottom: 16,
  },
  permissionButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 16,
    opacity: 0.7,
  },
});

