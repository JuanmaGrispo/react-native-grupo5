import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../components/Home/HomeScreen";
import DetailScreen from "../components/Detail/DetailScreen";
import LoginScreen from "../components/Login";
import MailScreen from "../components/Mail";
import ConfirmOtpScreen from "../components/Confirm0tp"; 
import WelcomeScreen from "../components/Welcome";
import ProfileScreen from "../components/profile/profile";
import { AuthContext } from "../context/AuthContext";
import { View, ActivityIndicator } from "react-native";

const Stack = createNativeStackNavigator();

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
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Detail" component={DetailScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Mail" component={MailScreen} />
          <Stack.Screen name="ConfirmOtp" component={ConfirmOtpScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
