import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import newsService from "../../services/newsService";

export default function NovedadesScreen() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const data = await newsService.getAllNews();
      setNews(data);
    } catch (error) {
      console.error("Error cargando novedades:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.content}>{item.content}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD800" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {news.length === 0 ? (
        <Text style={styles.noNews}>No hay novedades por el momento.</Text>
      ) : (
        <FlatList
          data={news}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  noNews: {
    color: "#FFD800",
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
  },
  card: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#222",
  },
  title: {
    color: "#FFD800",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  content: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
});
