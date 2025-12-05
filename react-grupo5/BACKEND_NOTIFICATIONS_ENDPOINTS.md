# Especificación de Endpoints: Sistema de Notificaciones

## 📋 Resumen

Este documento especifica los endpoints que el backend debe implementar para el sistema completo de notificaciones del frontend React Native.

---

## 🔐 Autenticación

**Todos los endpoints requieren autenticación JWT:**
- Header: `Authorization: Bearer <JWT_TOKEN>`
- El token debe ser válido y corresponder al usuario autenticado

---

## 📡 Endpoints Requeridos

### 1. Obtener Notificaciones No Leídas

**GET** `/api/v1/notifications`

Obtiene todas las notificaciones no leídas del usuario autenticado.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:** Ninguno

**Response 200:**
```json
[
  {
    "id": "uuid",
    "type": "SESSION_CANCELED" | "SESSION_RESCHEDULED" | "SESSION_REMINDER",
    "title": "Sesión cancelada: Yoga Matutino",
    "body": "La sesión programada para 15/11/2024 09:00 ha sido cancelada.",
    "read": false,
    "createdAt": "2024-11-15T10:30:00.000Z",
    "session": {
      "id": "uuid",
      "startAt": "2024-11-15T09:00:00.000Z",
      "classRef": {
        "id": "uuid",
        "title": "Yoga Matutino"
      },
      "branch": {
        "id": "uuid",
        "name": "Sede Centro"
      }
    },
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
]
```

**Response 401:** Token inválido o expirado
```json
{
  "error": "Unauthorized",
  "message": "Token inválido o expirado"
}
```

**Nota:** Este endpoint también debe procesar automáticamente los recordatorios de sesiones que empiezan en 1 hora (según la documentación existente).

---

### 2. Obtener Todas las Notificaciones

**GET** `/api/v1/notifications?all=true`

Obtiene todas las notificaciones del usuario (leídas y no leídas), limitadas a 50 por defecto.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `all` (required): `true` para obtener todas las notificaciones

**Response 200:**
```json
[
  {
    "id": "uuid",
    "type": "SESSION_CANCELED",
    "title": "...",
    "body": "...",
    "read": true,
    "createdAt": "2024-11-15T10:30:00.000Z",
    "session": { ... },
    "user": { ... }
  },
  {
    "id": "uuid",
    "type": "SESSION_REMINDER",
    "title": "...",
    "body": "...",
    "read": false,
    "createdAt": "2024-11-15T11:00:00.000Z",
    "session": { ... },
    "user": { ... }
  }
]
```

**Response 400:** Si falta el parámetro `all=true`
```json
{
  "error": "Bad Request",
  "message": "El parámetro 'all' debe ser 'true' para obtener todas las notificaciones"
}
```

---

### 3. Marcar Notificación como Leída

**POST** `/api/v1/notifications/:id/read`

Marca una notificación específica como leída.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
- `id` (required): UUID de la notificación

**Request Body:**
```json
{}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

**Response 404:** Notificación no encontrada o no pertenece al usuario
```json
{
  "error": "Not Found",
  "message": "Notificación no encontrada"
}
```

**Response 400:** Notificación ya está marcada como leída
```json
{
  "error": "Bad Request",
  "message": "La notificación ya está marcada como leída"
}
```

**Lógica:**
- Verificar que la notificación pertenezca al usuario autenticado
- Actualizar el campo `read` a `true`
- Retornar éxito

---

### 4. Marcar Todas las Notificaciones como Leídas

**POST** `/api/v1/notifications/read-all`

Marca todas las notificaciones del usuario como leídas.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Todas las notificaciones fueron marcadas como leídas",
  "count": 5
}
```

**Lógica:**
- Actualizar todas las notificaciones del usuario donde `read = false` a `read = true`
- Retornar el número de notificaciones actualizadas

---

### 5. Marcar Notificación como No Leída ⭐ NUEVO

**POST** `/api/v1/notifications/:id/unread`

Marca una notificación específica como no leída (permite "desmarcar" una notificación leída).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
- `id` (required): UUID de la notificación

**Request Body:**
```json
{}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Notificación marcada como no leída"
}
```

**Response 404:** Notificación no encontrada o no pertenece al usuario
```json
{
  "error": "Not Found",
  "message": "Notificación no encontrada"
}
```

**Response 400:** Notificación ya está marcada como no leída
```json
{
  "error": "Bad Request",
  "message": "La notificación ya está marcada como no leída"
}
```

**Lógica:**
- Verificar que la notificación pertenezca al usuario autenticado
- Actualizar el campo `read` a `false`
- Retornar éxito

---

### 6. Eliminar Notificación ⭐ NUEVO

**DELETE** `/api/v1/notifications/:id`

Elimina una notificación específica del usuario.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `id` (required): UUID de la notificación

**Response 200:**
```json
{
  "success": true,
  "message": "Notificación eliminada correctamente"
}
```

**Response 204:** También es válido retornar 204 No Content (sin body)

**Response 404:** Notificación no encontrada o no pertenece al usuario
```json
{
  "error": "Not Found",
  "message": "Notificación no encontrada"
}
```

**Lógica:**
- Verificar que la notificación pertenezca al usuario autenticado
- Eliminar la notificación de la base de datos (soft delete o hard delete según tu implementación)
- Retornar éxito

**Nota sobre Soft Delete:**
Si usas soft delete, asegúrate de filtrar las notificaciones eliminadas en los endpoints GET.

---

## 🗄️ Estructura de Base de Datos Sugerida

### Tabla: `notifications`

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('SESSION_CANCELED', 'SESSION_RESCHEDULED', 'SESSION_REMINDER')),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL -- Para soft delete
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## 🔒 Validaciones y Seguridad

### Validaciones Comunes a Todos los Endpoints:

1. **Autenticación:**
   - Verificar que el token JWT sea válido
   - Extraer el `user_id` del token

2. **Autorización:**
   - Verificar que la notificación pertenezca al usuario autenticado
   - No permitir que un usuario acceda a notificaciones de otro usuario

3. **Validación de IDs:**
   - Verificar que el `id` sea un UUID válido
   - Verificar que la notificación exista antes de actualizar/eliminar

4. **Rate Limiting:**
   - Considerar implementar rate limiting para prevenir abuso

---

## 📝 Ejemplos de Implementación

### Ejemplo: Marcar como Leída (Node.js/Express)

```javascript
router.post('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Del middleware de autenticación

    // Verificar que la notificación existe y pertenece al usuario
    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notificación no encontrada'
      });
    }

    if (notification.read) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'La notificación ya está marcada como leída'
      });
    }

    // Actualizar
    notification.read = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al procesar la solicitud'
    });
  }
});
```

### Ejemplo: Eliminar Notificación (Node.js/Express)

```javascript
router.delete('/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que la notificación existe y pertenece al usuario
    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notificación no encontrada'
      });
    }

    // Soft delete
    notification.deleted_at = new Date();
    await notification.save();

    // O hard delete:
    // await notification.destroy();

    return res.status(200).json({
      success: true,
      message: 'Notificación eliminada correctamente'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al procesar la solicitud'
    });
  }
});
```

### Ejemplo: Marcar como No Leída (Node.js/Express)

```javascript
router.post('/notifications/:id/unread', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notificación no encontrada'
      });
    }

    if (!notification.read) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'La notificación ya está marcada como no leída'
      });
    }

    notification.read = false;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notificación marcada como no leída'
    });
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al procesar la solicitud'
    });
  }
});
```

---

## ✅ Checklist de Implementación

- [ ] **GET** `/api/v1/notifications` - Obtener no leídas
- [ ] **GET** `/api/v1/notifications?all=true` - Obtener todas
- [ ] **POST** `/api/v1/notifications/:id/read` - Marcar como leída
- [ ] **POST** `/api/v1/notifications/read-all` - Marcar todas como leídas
- [ ] **POST** `/api/v1/notifications/:id/unread` - Marcar como no leída ⭐ NUEVO
- [ ] **DELETE** `/api/v1/notifications/:id` - Eliminar notificación ⭐ NUEVO
- [ ] Validaciones de autenticación y autorización
- [ ] Manejo de errores apropiado
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Documentación en Swagger/OpenAPI (opcional pero recomendado)

---

## 🧪 Casos de Prueba Sugeridos

### Test 1: Marcar como Leída
1. Crear una notificación no leída para un usuario
2. Llamar al endpoint con el token del usuario
3. Verificar que `read = true` en la BD
4. Verificar respuesta 200

### Test 2: Marcar como No Leída
1. Crear una notificación leída para un usuario
2. Llamar al endpoint con el token del usuario
3. Verificar que `read = false` en la BD
4. Verificar respuesta 200

### Test 3: Eliminar Notificación
1. Crear una notificación para un usuario
2. Llamar al endpoint DELETE con el token del usuario
3. Verificar que la notificación no aparezca en GET
4. Verificar respuesta 200

### Test 4: Seguridad - Usuario A no puede acceder a notificación de Usuario B
1. Crear notificación para Usuario A
2. Intentar marcar como leída con token de Usuario B
3. Verificar respuesta 404

### Test 5: Validación de ID Inválido
1. Llamar endpoint con UUID inválido
2. Verificar respuesta 400 o 404

---

## 📚 Notas Adicionales

1. **Orden de Notificaciones:**
   - Las notificaciones deben retornarse ordenadas por `createdAt DESC` (más recientes primero)

2. **Paginación (Opcional pero Recomendado):**
   - Considerar agregar paginación para el endpoint de todas las notificaciones
   - Ejemplo: `GET /notifications?all=true&page=1&limit=50`

3. **Filtros Adicionales (Opcional):**
   - Filtrar por tipo: `GET /notifications?type=SESSION_CANCELED`
   - Filtrar por fecha: `GET /notifications?from=2024-11-01&to=2024-11-30`

4. **Performance:**
   - Usar índices en la base de datos para `user_id`, `read`, y `created_at`
   - Considerar caché para notificaciones frecuentemente consultadas

---

## 🚀 Prioridad de Implementación

1. **Alta Prioridad (Crítico):**
   - ✅ GET `/notifications` (ya existe)
   - ✅ POST `/notifications/:id/read` (ya existe)
   - ✅ POST `/notifications/read-all` (ya existe)
   - ⭐ POST `/notifications/:id/unread` (NUEVO - necesario para funcionalidad completa)
   - ⭐ DELETE `/notifications/:id` (NUEVO - necesario para funcionalidad completa)

2. **Media Prioridad:**
   - GET `/notifications?all=true` (ya existe, verificar funcionamiento)

3. **Baja Prioridad (Mejoras futuras):**
   - Paginación
   - Filtros adicionales
   - Webhooks para notificaciones en tiempo real

---

**¿Preguntas?** Contactar al equipo de frontend para aclaraciones sobre el comportamiento esperado.

