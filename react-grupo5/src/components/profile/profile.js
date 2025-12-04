// src/screens/Profile/ProfileScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert, ScrollView, Image
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentUser, updateCurrentUserName, updateCurrentUserProfilePicture } from '../../services/userService';
import api from '../../services/apiService';

const COLORS = {
  black: '#000000',
  white: '#FFFFFF',
  yellow: '#FFD800',
  gray: '#3A3A3A',
  darkerGray: '#222222',
};

export default function ProfileScreen() {
  const navigation = useNavigation();

  const [user, setUser] = useState(null);        // { id, name, email }
  const [loading, setLoading] = useState(true);  // GET
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);   // PUT
  const [uploadingImage, setUploadingImage] = useState(false);   // Para la carga de imagen

  async function fetchUser() {
    try {
      setError('');
      setLoading(true);
      const me = await getCurrentUser();
      setUser(me);
      if (!isEditing) setNewName(me?.name || '');
    } catch (e) {
      const msg = e?.message === 'NO_TOKEN' ? 'Sesión expirada' : 'No se pudo cargar tu perfil';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Si quisieras refrescar al volver a la pantalla:
      // fetchUser();
      return () => {};
    }, [])
  );

  async function handleSave() {
    if (!newName?.trim()) {
      Alert.alert('Nombre requerido', 'Ingresá un nombre válido.');
      return;
    }
    try {
      setSaving(true);
      const updated = await updateCurrentUserName(newName.trim());
      setUser(updated);
      setIsEditing(false);
      Alert.alert('Listo', 'Tu nombre fue actualizado.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el cambio. Intentá nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePickImage() {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Necesitamos acceso a tu galería para cambiar la foto de perfil.');
        return;
      }

      // Abrir el selector de imágenes
      // En expo-image-picker v17+, usar string directamente o MediaTypeOptions (aunque deprecado, aún funciona)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images', // Usar string directamente (compatible con v17+)
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await handleUploadImage(imageUri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Intentá nuevamente.');
    }
  }

  async function handleUploadImage(imageUri) {
    try {
      setUploadingImage(true);
      console.log('🖼️ Iniciando subida de imagen:', imageUri.substring(0, 50));
      const updated = await updateCurrentUserProfilePicture(imageUri);
      
      // Actualizar el estado del usuario con la nueva información
      setUser(updated);
      
      // Mostrar mensaje de éxito
      Alert.alert('✅ Listo', 'Tu foto de perfil fue actualizada exitosamente.');
    } catch (error) {
      console.error('Error al subir imagen:', error);
      
      // Usar el mensaje del error (ya viene formateado desde userService)
      let errorMessage = error.message || 'No se pudo actualizar la foto de perfil.';
      
      // Si es un error de red, agregar más contexto
      if (error.message.includes('conexión') || error.message.includes('conect')) {
        errorMessage = 'Error de conexión. Verificá que:\n• El servidor esté corriendo\n• Estés conectado a la misma red WiFi\n• La IP del servidor sea correcta';
      }
      
      Alert.alert('❌ Error', errorMessage);
    } finally {
      setUploadingImage(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={[styles.button, styles.buttonYellow]} onPress={fetchUser}>
          <Text style={styles.buttonTextBlack}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
      {/* Título */}
      <View style={styles.header}>
        <Text style={styles.title}>RitmoFit</Text>
        <Text style={styles.subtitle}>Perfil</Text>
      </View>

      {/* Foto de perfil */}
      <View style={styles.profilePictureContainer}>
        <TouchableOpacity
          onPress={handlePickImage}
          disabled={uploadingImage}
          style={styles.profilePictureWrapper}
          accessible
          accessibilityLabel="Cambiar foto de perfil"
        >
          {uploadingImage ? (
            <View style={styles.profilePicturePlaceholder}>
              <ActivityIndicator color={COLORS.yellow} />
            </View>
          ) : (
            <>
              {user?.photoUrl ? (
                <Image
                  source={{ 
                    uri: user.photoUrl.startsWith('http') 
                      ? user.photoUrl 
                      : user.photoUrl.startsWith('/')
                        ? `${api.defaults.baseURL.replace('/api/v1', '')}${user.photoUrl}`
                        : `${api.defaults.baseURL.replace('/api/v1', '')}/${user.photoUrl}`
                  }}
                  style={styles.profilePicture}
                />
              ) : (
                <View style={styles.profilePicturePlaceholder}>
                  <Text style={styles.profilePictureInitial}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.profilePictureEditBadge}>
                <Text style={styles.profilePictureEditIcon}>📷</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Fila: Nombre + Editar */}
      <View style={styles.row}>
        <View style={[styles.inputBox, styles.disabledBox]}>
          <Text style={styles.inputText} numberOfLines={1}>
            {user?.name || '—'}
          </Text>
        </View>
        <TouchableOpacity
          accessible accessibilityLabel="Editar nombre"
          style={styles.iconButton}
          onPress={() => { setIsEditing(true); setNewName(user?.name || ''); }}
        >
          <Text style={styles.editIcon}>✎</Text>
        </TouchableOpacity>
      </View>

      {/* Email (readonly) */}
      <View style={[styles.inputBox, styles.disabledBox, { height: 50, marginBottom: 22 }]}>
        <Text style={styles.inputText} numberOfLines={1}>
          {user?.email || '—'}
        </Text>
      </View>

      {/* Bloque oculto: editar nombre */}
      {isEditing && (
        <View style={styles.editCard}>
          <Text style={styles.editTitle}>Editar nombre</Text>
          <TextInput
            placeholder="Nuevo nombre"
            placeholderTextColor="#999"
            value={newName}
            onChangeText={setNewName}
            style={styles.textInput}
          />
          <View style={[styles.row, { justifyContent: 'flex-end', marginTop: 12 }]}>
            <TouchableOpacity
              accessible accessibilityLabel="Cancelar edición"
              style={[styles.button, styles.buttonGray]}
              onPress={() => { setIsEditing(false); setNewName(user?.name || ''); }}
            >
              <Text style={styles.buttonTextWhite}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessible accessibilityLabel="Guardar nombre"
              style={[styles.button, styles.buttonYellow, { marginLeft: 12, opacity: saving ? 0.6 : 1 }]}
              onPress={saving ? undefined : handleSave}
            >
              {saving ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.buttonTextBlack}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 49,
    paddingBottom: 24,
  },
  title: {
    color: COLORS.yellow,
    fontSize: 42,
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.white,
    fontSize: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    marginTop: 12,
    marginBottom: 16,
  },
  inputBox: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkerGray,
    backgroundColor: '#111',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  disabledBox: {
    opacity: 0.9,
  },
  inputText: {
    color: COLORS.white,
    fontSize: 18,
  },
  iconButton: {
    width: 40,
    height: 50,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    color: COLORS.yellow,
    fontSize: 18,
  },
  editCard: {
    backgroundColor: '#121212',
    borderRadius: 12,
    borderColor: COLORS.darkerGray,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  editTitle: {
    color: COLORS.yellow,
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    color: COLORS.white,
    backgroundColor: '#111',
    borderColor: COLORS.darkerGray,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    minWidth: 120,
  },
  buttonYellow: {
    backgroundColor: COLORS.yellow,
  },
  buttonGray: {
    backgroundColor: COLORS.gray,
  },
  buttonTextBlack: {
    color: COLORS.black,
    fontWeight: '700',
  },
  buttonTextWhite: {
    color: COLORS.white,
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.white,
  },
  errorText: {
    color: COLORS.white,
    marginBottom: 12,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  profilePictureWrapper: {
    position: 'relative',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.yellow,
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray,
    borderWidth: 3,
    borderColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePictureInitial: {
    color: COLORS.white,
    fontSize: 48,
    fontWeight: '700',
  },
  profilePictureEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.black,
  },
  profilePictureEditIcon: {
    fontSize: 18,
  },
});
