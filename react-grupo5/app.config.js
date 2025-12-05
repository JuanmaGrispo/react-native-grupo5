// app.config.js
// Este archivo reemplaza app.json y permite usar variables de entorno
require('dotenv').config();

module.exports = {
  expo: {
    name: "react-grupo5",
    slug: "react-grupo5",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.anonymous.reactgrupo5",
      permissions: [
        "RECEIVE_BOOT_COMPLETED"
      ]
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#FFD800",
        }
      ]
    ],
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      // Variables de entorno accesibles desde Constants.expoConfig.extra
      apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000/api/v1",
    },
  },
};

