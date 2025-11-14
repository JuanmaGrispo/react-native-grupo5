// src/services/userService.js
import api from "./apiService";
import { getToken } from "../utils/tokenStorage";

/**
 * Obtiene el usuario actual (requiere Bearer token).
 * Endpoint esperado: GET /users/me
 */
export const getCurrentUser = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const response = await api.get("/user/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // { id, name, email, ... }
  } catch (error) {
    console.error(
      "Error fetching current user:",
      error?.response?.status,
      error?.response?.data
    );
    throw error;
  }
};

/**
 * Actualiza el nombre del usuario actual (requiere Bearer token).
 * Endpoint esperado: PUT /users/me  body: { name }
 */
export const updateCurrentUserName = async (name) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    const response = await api.put(
      "/user/me",
      { name },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating user name:",
      error?.response?.status,
      error?.response?.data
    );
    throw error;
  }
};

/**
 * Actualiza la foto de perfil del usuario actual (requiere Bearer token).
 * Endpoint: POST /api/v1/user/me/photo
 * @param {string} imageUri - URI local de la imagen seleccionada
 * @returns {Promise} Usuario actualizado con la nueva foto de perfil
 */
export const updateCurrentUserProfilePicture = async (imageUri) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("NO_TOKEN");

    // Verificar conectividad primero (test rápido)
    console.log('🔍 Verificando conectividad con el servidor...');
    try {
      await api.get("/user/me", { timeout: 5000 });
      console.log('✅ Servidor accesible');
    } catch (connectError) {
      console.error('❌ No se puede conectar al servidor:', connectError.message);
      throw new Error('No se puede conectar al servidor. Verificá que esté corriendo y accesible.');
    }

    // Crear FormData para enviar la imagen
    const formData = new FormData();
    
    // Extraer el nombre del archivo de la URI
    const filename = imageUri.split('/').pop() || 'profile.jpg';
    
    // Determinar el tipo MIME correctamente
    let mimeType = 'image/jpeg'; // Por defecto
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    if (ext && mimeTypes[ext]) {
      mimeType = mimeTypes[ext];
    }
    
    // En React Native, el formato del objeto para FormData es específico
    // La URI puede ser file://, content://, o ph:// dependiendo de la plataforma
    const fileData = {
      uri: imageUri,
      name: filename,
      type: mimeType,
    };
    
    console.log('📤 Preparando subida de imagen:', {
      uri: imageUri.substring(0, 60) + '...',
      name: fileData.name,
      type: fileData.type,
      formDataType: formData instanceof FormData ? 'FormData' : 'unknown',
    });
    
    // El backend espera el campo "photo" (debe coincidir con FileInterceptor('photo', ...))
    formData.append('photo', fileData);

    console.log('📡 Enviando petición POST a /user/me/photo...');
    const fullUrl = `${api.defaults.baseURL}/user/me/photo`;
    console.log('📍 URL completa:', fullUrl);
    
    // Usar fetch directamente para mejor compatibilidad con FormData en React Native
    // axios a veces tiene problemas con FormData en React Native
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // NO establecer Content-Type - fetch lo hace automáticamente con FormData
      },
      body: formData,
    });
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      };
      throw error;
    }
    
    // Parsear la respuesta JSON
    const data = await response.json();
    
    console.log('✅ Imagen subida exitosamente');
    console.log('📸 Respuesta del servidor:', {
      id: data?.id,
      photoUrl: data?.photoUrl,
    });
    
    // Asegurarse de que la respuesta tenga photoUrl
    if (!data?.photoUrl) {
      console.warn('⚠️ El servidor no devolvió photoUrl en la respuesta');
    }
    
    return data;
  } catch (error) {
    // Log detallado del error
    console.error("❌ Error updating profile picture:");
    console.error("Status:", error?.status || error?.response?.status);
    console.error("Data:", error?.response?.data);
    console.error("Message:", error?.message);
    console.error("Name:", error?.name);
    
    // Si el servidor respondió con un error, extraer el mensaje
    if (error.response || error.status) {
      const status = error.status || error.response?.status;
      const data = error.response?.data || {};
      
      // Intentar extraer el mensaje del backend
      let errorMessage = data?.message || data?.error || 'Error del servidor';
      
      if (status === 400) {
        errorMessage = data?.message || 'Formato de imagen no válido o archivo no proporcionado';
      } else if (status === 401) {
        errorMessage = 'Sesión expirada. Por favor, iniciá sesión nuevamente.';
      } else if (status === 413) {
        errorMessage = 'La imagen es demasiado grande. El máximo es 5MB.';
      } else if (status === 404) {
        errorMessage = 'Endpoint no encontrado. Verificá que el backend esté actualizado.';
      }
      
      // Crear un error con el mensaje del servidor
      const serverError = new Error(errorMessage);
      serverError.status = status;
      serverError.response = error.response || { status, data };
      throw serverError;
    }
    
    // Si es un error de red (TypeError, Network request failed, etc.)
    if (error.message?.includes('Network') || error.message?.includes('Failed') || error.name === 'TypeError') {
      const baseURL = api.defaults.baseURL;
      console.error('🔧 Checklist de diagnóstico:');
      console.error('1. ¿El servidor está corriendo en', baseURL, '?');
      console.error('2. ¿Estás en la misma red WiFi que el servidor?');
      console.error('3. ¿La IP 192.168.1.11 es correcta? (Verificá con ipconfig)');
      console.error('4. ¿El firewall está bloqueando el puerto 3000?');
      console.error('5. ¿El endpoint POST /api/v1/user/me/photo existe en el backend?');
      console.error('6. ¿El backend tiene configurado CORS para aceptar requests con FormData?');
      
      throw new Error('Error de conexión. Verificá que el servidor esté corriendo y accesible.');
    }
    
    throw error;
  }
};

export default {
  getCurrentUser,
  updateCurrentUserName,
  updateCurrentUserProfilePicture,
};
