import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../components/Home/HomeScreen";
import DetailScreen from "../components/Detail/DetailScreen";
import LoginScreen from "../components/Login";
import MailScreen from "../components/Mail";
import ConfirmOtpScreen from "../components/Confirm0tp"; 
import WelcomeScreen from "../components/Welcome";
import ProfileScreen from "../components/profile/profile";
import ReservationsScreen from "../components/reservations/ReservationsScreen";
import HistorialScreen from "../components/Historial/HistorialScreen";
import { AuthContext } from "../context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import NovedadesScreen from "../components/Novedades/novedades";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator para las pantallas principales
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Reservations") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Historial") {
            iconName = focused ? "time" : "time-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#FFD800",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopColor: "#222222",
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: "Inicio" }}
      />
      <Tab.Screen 
        name="Reservations" 
        component={ReservationsScreen}
        options={{ tabBarLabel: "Reservas" }}
      />
      <Tab.Screen 
        name="Historial" 
        component={HistorialScreen}
        options={{ tabBarLabel: "Historial" }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: "Perfil" }}
      />
      <Tab.Screen 
        name="Novedades" 
        component={NovedadesScreen}
        options={{ 
          tabBarLabel: "Novedades",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? "megaphone" : "megaphone-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />

    </Tab.Navigator>
  );
}

export default function RootStack() {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Detail" component={DetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Mail" component={MailScreen} />
          <Stack.Screen name="ConfirmOtp" component={ConfirmOtpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
