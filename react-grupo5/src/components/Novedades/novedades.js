import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function NovedadesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Próximamente novedades...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  text: {
    color: "#FFD800",
    fontSize: 18,
    fontWeight: "bold",
  },
});
