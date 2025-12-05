# 🐛 Bug Report: Notificaciones Leídas se Vuelven No Leídas al Recargar

## 📋 Resumen del Problema

**Síntoma:** Cuando el usuario marca una notificación como leída y luego recarga la app, la notificación vuelve a aparecer como no leída.

**Severidad:** Alta - Afecta la experiencia del usuario y la persistencia de datos.

---

## 🔍 Análisis del Flujo Actual

### Flujo del Frontend:

1. **Carga inicial:**
   - Frontend llama: `GET /api/v1/notifications?all=true`
   - Espera recibir: Todas las notificaciones (leídas y no leídas) con su campo `read` correcto

2. **Usuario marca como leída:**
   - Frontend llama: `POST /api/v1/notifications/:id/read`
   - Frontend actualiza estado local: `read: true`
   - ✅ Funciona correctamente en la UI

3. **Usuario recarga la app:**
   - Frontend llama nuevamente: `GET /api/v1/notifications?all=true`
   - ❌ **PROBLEMA:** Recibe notificaciones con `read: false` aunque fueron marcadas como leídas

---

## 🎯 Comportamiento Esperado

### Endpoint: `GET /api/v1/notifications?all=true`

**Debe retornar:**
```json
[
  {
    "id": "uuid-1",
    "type": "SESSION_CANCELED",
    "title": "Sesión cancelada",
    "body": "...",
    "read": false,  // ✅ No leída
    "createdAt": "2024-11-15T10:00:00.000Z",
    "session": { ... },
    "user": { ... }
  },
  {
    "id": "uuid-2",
    "type": "SESSION_REMINDER",
    "title": "Recordatorio",
    "body": "...",
    "read": true,   // ✅ Leída (marcada por el usuario)
    "createdAt": "2024-11-15T09:00:00.000Z",
    "session": { ... },
    "user": { ... }
  }
]
```

**Actualmente retorna (INCORRECTO):**
```json
[
  {
    "id": "uuid-1",
    "read": false,  // ❌ Siempre false
    ...
  },
  {
    "id": "uuid-2",
    "read": false,  // ❌ Debería ser true pero es false
    ...
  }
]
```

---

## 🔧 Posibles Causas del Bug

### Causa 1: El campo `read` no se persiste en la BD

**Problema:** Cuando se llama `POST /notifications/:id/read`, el backend no está actualizando el campo `read` en la base de datos.

**Solución:**
```sql
-- Verificar que la actualización se está haciendo
UPDATE notifications 
SET read = true, updated_at = NOW() 
WHERE id = :notificationId AND user_id = :userId;
```

**Verificación:**
```sql
-- Después de marcar como leída, verificar en la BD:
SELECT id, read, updated_at 
FROM notifications 
WHERE id = :notificationId;
-- Debe mostrar: read = true
```

---

### Causa 2: El endpoint `GET /notifications?all=true` no consulta el campo `read`

**Problema:** El endpoint está ignorando el campo `read` o siempre retorna `read: false`.

**Código incorrecto (ejemplo):**
```javascript
// ❌ INCORRECTO - Siempre retorna read: false
router.get('/notifications', async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user.id }
  });
  
  return res.json(notifications.map(n => ({
    ...n.toJSON(),
    read: false  // ❌ Siempre false
  })));
});
```

**Código correcto:**
```javascript
// ✅ CORRECTO - Retorna el valor real de read
router.get('/notifications', async (req, res) => {
  const { all } = req.query;
  
  let whereClause = { user_id: req.user.id };
  
  // Si all=true, traer todas (leídas y no leídas)
  // Si no, solo traer no leídas
  if (all !== 'true') {
    whereClause.read = false;
  }
  
  const notifications = await Notification.findAll({
    where: whereClause,
    order: [['created_at', 'DESC']]
  });
  
  return res.json(notifications); // ✅ Retorna read tal como está en la BD
});
```

---

### Causa 3: El endpoint `POST /notifications/:id/read` no actualiza la BD

**Problema:** El endpoint marca como leída pero no persiste el cambio.

**Código incorrecto:**
```javascript
// ❌ INCORRECTO - Solo actualiza en memoria
router.post('/notifications/:id/read', async (req, res) => {
  const notification = await Notification.findOne({
    where: { id: req.params.id, user_id: req.user.id }
  });
  
  notification.read = true; // ❌ No se guarda
  // Falta: await notification.save();
  
  return res.json({ success: true });
});
```

**Código correcto:**
```javascript
// ✅ CORRECTO - Persiste en la BD
router.post('/notifications/:id/read', async (req, res) => {
  const notification = await Notification.findOne({
    where: { id: req.params.id, user_id: req.user.id }
  });
  
  if (!notification) {
    return res.status(404).json({ error: 'Not Found' });
  }
  
  notification.read = true;
  await notification.save(); // ✅ Persiste el cambio
  
  return res.json({ success: true });
});
```

---

## 🧪 Pasos para Reproducir el Bug

1. **Preparación:**
   - Usuario tiene al menos 2 notificaciones no leídas

2. **Acción 1:**
   - Usuario marca una notificación como leída
   - ✅ La notificación desaparece del contador de no leídas
   - ✅ La notificación se muestra como leída en la UI

3. **Acción 2:**
   - Usuario recarga la app (pull-to-refresh o reinicia la app)

4. **Resultado esperado:**
   - La notificación marcada como leída debe seguir apareciendo como leída

5. **Resultado actual (BUG):**
   - ❌ La notificación vuelve a aparecer como no leída
   - ❌ El contador de no leídas se incrementa incorrectamente

---

## 🔍 Cómo Verificar el Bug en el Backend

### Test 1: Verificar que se persiste `read` en la BD

```sql
-- 1. Obtener ID de una notificación
SELECT id, read FROM notifications WHERE user_id = :userId LIMIT 1;

-- 2. Llamar al endpoint (desde Postman o similar)
POST /api/v1/notifications/:id/read

-- 3. Verificar en la BD que read cambió a true
SELECT id, read, updated_at FROM notifications WHERE id = :id;
-- Debe mostrar: read = true
```

### Test 2: Verificar que el endpoint retorna `read` correcto

```bash
# 1. Marcar una notificación como leída
curl -X POST "http://localhost:9100/api/v1/notifications/:id/read" \
  -H "Authorization: Bearer <token>"

# 2. Obtener todas las notificaciones
curl "http://localhost:9100/api/v1/notifications?all=true" \
  -H "Authorization: Bearer <token>"

# 3. Verificar que la notificación tiene read: true
# En la respuesta JSON, buscar la notificación por ID y verificar:
# "read": true  ✅
# "read": false ❌ (BUG)
```

### Test 3: Verificar directamente en la BD

```sql
-- Ver todas las notificaciones de un usuario con su estado read
SELECT 
  id,
  title,
  read,
  created_at,
  updated_at
FROM notifications
WHERE user_id = :userId
ORDER BY created_at DESC;

-- Verificar que:
-- 1. Las notificaciones marcadas como leídas tienen read = true
-- 2. Las notificaciones no leídas tienen read = false
-- 3. El campo updated_at cambió cuando se marcó como leída
```

---

## ✅ Solución Esperada

### 1. Verificar la estructura de la tabla

```sql
-- Verificar que la columna read existe y es BOOLEAN
DESCRIBE notifications;
-- O
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'notifications' AND column_name = 'read';
```

### 2. Verificar que el UPDATE funciona

```sql
-- Test manual de actualización
UPDATE notifications 
SET read = true 
WHERE id = :testId AND user_id = :userId;

-- Verificar
SELECT read FROM notifications WHERE id = :testId;
-- Debe retornar: true
```

### 3. Verificar el endpoint GET

```javascript
// El endpoint debe retornar el valor real de read
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const { all } = req.query;
    const userId = req.user.id; // Del token JWT
    
    const whereClause = { user_id: userId };
    
    // Si all=true, traer todas (leídas y no leídas)
    // Si no, solo traer no leídas
    if (all !== 'true') {
      whereClause.read = false;
    }
    
    const notifications = await Notification.findAll({
      where: whereClause,
      include: [
        {
          model: Session,
          include: [
            { model: Class, as: 'classRef' },
            { model: Branch }
          ]
        },
        { model: User }
      ],
      order: [['created_at', 'DESC']],
      limit: 50
    });
    
    // ✅ Retornar read tal como está en la BD
    return res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
```

### 4. Verificar el endpoint POST (marcar como leída)

```javascript
router.post('/notifications/:id/read', authenticateToken, async (req, res) => {
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
    
    if (notification.read) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'La notificación ya está marcada como leída'
      });
    }
    
    // ✅ ACTUALIZAR EN LA BD
    notification.read = true;
    notification.updated_at = new Date();
    await notification.save();
    
    // ✅ Verificar que se guardó (opcional, para debug)
    const updated = await Notification.findByPk(id);
    console.log('Notification updated:', updated.read); // Debe ser true
    
    return res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
```

---

## 📊 Flujo Correcto Esperado

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario marca notificación como leída                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend: POST /notifications/:id/read                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend: UPDATE notifications SET read = true            │
│    WHERE id = :id AND user_id = :userId                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend: Verificar en BD que read = true ✅              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Usuario recarga la app                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend: GET /notifications?all=true                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Backend: SELECT * FROM notifications                     │
│    WHERE user_id = :userId                                  │
│    ORDER BY created_at DESC                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Backend: Retorna notificaciones con read correcto ✅     │
│    - read: true para las leídas                            │
│    - read: false para las no leídas                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Frontend: Muestra notificaciones con estado correcto ✅   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Checklist para el Backend Dev

- [ ] **Verificar estructura de BD:**
  - [ ] La columna `read` existe en la tabla `notifications`
  - [ ] La columna `read` es de tipo BOOLEAN (o equivalente)
  - [ ] La columna `read` tiene valor por defecto `false`

- [ ] **Verificar endpoint POST `/notifications/:id/read`:**
  - [ ] Actualiza el campo `read` a `true` en la BD
  - [ ] Guarda el cambio con `save()` o `update()`
  - [ ] Verifica que el cambio se persistió consultando la BD después

- [ ] **Verificar endpoint GET `/notifications?all=true`:**
  - [ ] Retorna todas las notificaciones (leídas y no leídas)
  - [ ] Retorna el valor real de `read` desde la BD (no hardcodea `false`)
  - [ ] No filtra por `read` cuando `all=true`

- [ ] **Verificar endpoint POST `/notifications/:id/unread`:**
  - [ ] Actualiza el campo `read` a `false` en la BD
  - [ ] Guarda el cambio correctamente

- [ ] **Tests:**
  - [ ] Test: Marcar como leída → Verificar en BD que `read = true`
  - [ ] Test: Obtener todas → Verificar que retorna `read: true` para las leídas
  - [ ] Test: Recargar → Verificar que el estado se mantiene

---

## 📝 Notas Adicionales

1. **El frontend siempre llama a `GET /notifications?all=true`** para obtener todas las notificaciones (leídas y no leídas).

2. **El frontend calcula el contador de no leídas** filtrando las notificaciones con `read: false` en el cliente.

3. **El estado `read` debe persistirse en la base de datos**, no solo en memoria o en el frontend.

4. **El campo `updated_at` debe actualizarse** cuando se marca como leída/no leída para tener un registro de cuándo cambió el estado.

---

## 🚨 Prioridad

**ALTA** - Este bug afecta directamente la experiencia del usuario y la confiabilidad del sistema. Las notificaciones leídas no deberían volver a aparecer como no leídas.

---

## 📞 Contacto

Si necesitas más información sobre el flujo del frontend o tienes preguntas, contactar al equipo de frontend.

**Archivos relevantes del frontend:**
- `src/hooks/useNotifications.js` - Hook que maneja el estado
- `src/services/notificationService.js` - Servicios de API
- `src/components/Notifications/NotificationScreen.js` - UI de notificaciones

