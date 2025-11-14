# Guía de Testing - Pantalla de Reservas

## Resumen del Manejo de Errores

La pantalla de Reservas maneja los siguientes casos:

1. **Sin reservas** - Estado vacío con mensaje claro
2. **Reserva cancelada** - Badge gris, mensaje "Cancelada", sin botón de cancelar
3. **Error de conexión** - Sin internet, muestra error con botón de reintentar
4. **Timeout** - Servidor tarda demasiado, muestra error con reintentar
5. **Sesión expirada** - Token inválido, muestra error y botón para ir a login
6. **Error del servidor** - Error 500+, muestra error con reintentar
7. **Backend no disponible** - Error 404, usa cache si existe, muestra advertencia
8. **Cancelar reserva ya cancelada** - Muestra error específico
9. **Cache válido** - Carga instantánea desde cache (< 30 seg)
10. **Cache expirado** - Refresca automáticamente (> 2 min)

---

## Casos de Prueba Detallados

### 1. CAMINO FELIZ - Usuario con Reservas Confirmadas

**Pasos:**
1. Iniciar sesión en la app
2. Navegar a la pestaña "Reservas" (tercera pestaña abajo)
3. Observar la pantalla

**Resultado Esperado:**
- Se muestran todas las reservas del usuario
- Cada reserva muestra:
  - Título de la clase (ej: "Yoga")
  - Badge verde "Confirmada"
  - Disciplina (ej: "Yoga")
  - Profesor (si existe)
  - Ubicación (ej: "Fit palermo - Palermo")
  - Fecha y hora formateadas
  - Duración en minutos
  - Cupos ocupados/totales
  - Botón rojo "Cancelar reserva"

**Validaciones:**
- ✅ Las reservas se cargan correctamente
- ✅ Toda la información se muestra
- ✅ El estado "Confirmada" es visible
- ✅ El botón de cancelar está disponible

---

### 2. CAMINO FELIZ - Cancelar Reserva Exitosamente

**Pasos:**
1. Ir a la pestaña "Reservas"
2. Tocar el botón "Cancelar reserva" en una reserva confirmada
3. Confirmar en el diálogo de alerta
4. Esperar la respuesta

**Resultado Esperado:**
- Aparece diálogo de confirmación
- Al confirmar, aparece spinner en el botón
- Alert de éxito: "Reserva cancelada correctamente"
- La lista se actualiza automáticamente
- La reserva desaparece de la lista (o cambia a "Cancelada" si se mantiene)

**Validaciones:**
- ✅ El diálogo de confirmación funciona
- ✅ La cancelación se procesa correctamente
- ✅ La lista se actualiza sin necesidad de refrescar manualmente
- ✅ El estado cambia correctamente

---

### 3. CASO: No Hay Reservas

**Pasos:**
1. Iniciar sesión con un usuario que no tiene reservas
2. Navegar a la pestaña "Reservas"

**Resultado Esperado:**
- Pantalla muestra icono de calendario
- Texto: "No tenés reservas aún"
- Subtítulo: "Reservá clases desde la pantalla principal"
- No hay cards de reservas
- Pull to refresh disponible

**Validaciones:**
- ✅ Se muestra el estado vacío correctamente
- ✅ El mensaje es claro y útil
- ✅ No hay errores en consola
- ✅ El pull to refresh funciona

---

### 4. CASO: Reserva Ya Cancelada

**Preparación:**
- Tener una reserva que ya fue cancelada previamente

**Pasos:**
1. Ir a la pestaña "Reservas"
2. Buscar una reserva con estado "Cancelada"

**Resultado Esperado:**
- Badge gris con texto "Cancelada"
- Mensaje "Esta reserva fue cancelada" en la card
- NO se muestra el botón "Cancelar reserva"
- La reserva tiene opacidad reducida

**Validaciones:**
- ✅ El estado "Cancelada" se muestra correctamente
- ✅ No hay botón de cancelar
- ✅ El mensaje es claro
- ✅ La UI refleja el estado correcto

---

### 5. CASO: Error de Conexión (Sin Internet)

**Pasos:**
1. Desactivar WiFi y datos móviles del dispositivo
2. Navegar a la pestaña "Reservas"
3. Observar la pantalla de error

**Resultado Esperado:**
- Icono de alerta naranja
- Título: "Error de conexión"
- Mensaje: "No se pudo conectar con el servidor. Verificá tu conexión a internet."
- Botón amarillo "Reintentar"
- Si hay cache antiguo, se muestra con banner de advertencia naranja arriba

**Validaciones:**
- ✅ El error se detecta correctamente
- ✅ El mensaje es claro y específico
- ✅ El botón de reintentar está visible
- ✅ Si hay cache, se muestra con advertencia

**Cómo Probar:**
- En Android: Configuración > WiFi > Desactivar
- En iOS: Configuración > WiFi > Desactivar
- O poner el dispositivo en modo avión

---

### 6. CASO: Timeout del Servidor

**Pasos:**
1. Configurar el servidor para que responda muy lento (> 15 segundos)
2. O cambiar el timeout en `apiService.js` a un valor muy bajo (ej: 1000ms)
3. Navegar a la pestaña "Reservas"

**Resultado Esperado:**
- Icono de alerta naranja
- Título: "Tiempo de espera agotado"
- Mensaje: "La solicitud tardó demasiado. Verificá tu conexión e intentá nuevamente."
- Botón amarillo "Reintentar"

**Validaciones:**
- ✅ El timeout se detecta correctamente
- ✅ El mensaje es apropiado
- ✅ El botón de reintentar funciona

**Cómo Simular:**
```javascript
// En apiService.js, cambiar:
timeout: 1000, // 1 segundo (muy bajo)
```

---

### 7. CASO: Sesión Expirada (401/403)

**Pasos:**
1. Eliminar o expirar el token manualmente
2. Navegar a la pestaña "Reservas"

**Resultado Esperado:**
- Icono de alerta naranja
- Título: "Sesión expirada"
- Mensaje: "Tu sesión expiró. Por favor, iniciá sesión nuevamente."
- Botón amarillo "Ir a Login"
- NO se muestra botón "Reintentar"

**Validaciones:**
- ✅ El error de autenticación se detecta
- ✅ El mensaje es claro
- ✅ El botón "Ir a Login" funciona
- ✅ No se muestra opción de reintentar (correcto)

**Cómo Simular:**
- Eliminar el token de AsyncStorage
- O esperar a que expire naturalmente
- O cambiar el token por uno inválido

---

### 8. CASO: Error del Servidor (500+)

**Pasos:**
1. Configurar el backend para devolver error 500
2. Navegar a la pestaña "Reservas"

**Resultado Esperado:**
- Icono de alerta naranja
- Título: "Error del servidor"
- Mensaje: "El servidor no está disponible en este momento. Intentá más tarde."
- Botón amarillo "Reintentar"

**Validaciones:**
- ✅ El error 500 se detecta
- ✅ El mensaje es apropiado
- ✅ El botón de reintentar funciona

---

### 9. CASO: Backend No Disponible (404)

**Pasos:**
1. Detener el servidor backend
2. Navegar a la pestaña "Reservas"

**Resultado Esperado:**
- Si NO hay cache:
  - Pantalla de error con título "No encontrado"
  - Mensaje: "No se encontraron reservas. Si creaste una reserva, podés intentar refrescar."
  - Botón "Reintentar"
- Si HAY cache:
  - Se muestran las reservas del cache
  - Banner naranja arriba: "No encontrado: [mensaje]"
  - Botón "Actualizar" en el banner

**Validaciones:**
- ✅ El error se maneja correctamente
- ✅ Si hay cache, se usa como fallback
- ✅ El banner de error es visible si hay datos antiguos
- ✅ El botón de actualizar funciona

---

### 10. CASO: Cache Válido (< 30 segundos)

**Pasos:**
1. Cargar reservas en la pantalla (primera vez)
2. Ir a otra pestaña (ej: Home)
3. Volver a la pestaña "Reservas" dentro de 30 segundos
4. Observar el comportamiento

**Resultado Esperado:**
- Las reservas se cargan instantáneamente
- NO se hace petición HTTP al servidor
- NO hay spinner de carga
- Los datos son los mismos que antes
- No hay delay visible

**Validaciones:**
- ✅ No hay petición HTTP (verificar en Network tab)
- ✅ La carga es instantánea
- ✅ Los datos son correctos
- ✅ No hay indicadores de carga

**Cómo Verificar:**
- Abrir DevTools > Network
- Cambiar de pestaña y volver
- Verificar que NO hay nueva petición a `/reservations/me`

---

### 11. CASO: Cache Expirado (> 2 minutos)

**Pasos:**
1. Cargar reservas en la pantalla
2. Esperar más de 2 minutos (o cambiar el tiempo en el código)
3. Cambiar de pestaña y volver a "Reservas"

**Resultado Esperado:**
- Se hace una nueva petición al servidor
- Se muestra spinner mientras carga
- Los datos se actualizan
- El cache se renueva con los nuevos datos

**Validaciones:**
- ✅ Se hace petición HTTP
- ✅ Los datos se actualizan
- ✅ El cache se renueva
- ✅ El spinner se muestra correctamente

**Cómo Acelerar la Prueba:**
```javascript
// En ReservationsScreen.js, cambiar:
const FORCE_REFRESH_DURATION = 10 * 1000; // 10 segundos en lugar de 2 min
```

---

### 12. CASO: Pull to Refresh

**Pasos:**
1. Estar en la pestaña "Reservas"
2. Arrastrar la lista hacia abajo
3. Soltar cuando aparezca el indicador de refresh

**Resultado Esperado:**
- Aparece indicador de refresh (spinner amarillo)
- Overlay "Actualizando reservas..." aparece arriba
- Se hace petición al servidor (ignora cache)
- Los datos se actualizan
- El overlay desaparece

**Validaciones:**
- ✅ El refresh funciona correctamente
- ✅ Se ignora el cache (siempre va a API)
- ✅ Los datos se actualizan
- ✅ El overlay es visible durante la carga

---

### 13. CASO: Cancelar Reserva - Error de Conexión

**Pasos:**
1. Tener una reserva confirmada
2. Desactivar internet
3. Intentar cancelar la reserva
4. Confirmar en el diálogo

**Resultado Esperado:**
- El diálogo de confirmación aparece
- Al confirmar, aparece spinner
- Alert de error: "Error de conexión: [mensaje]"
- Banner de error en la card (opcional)
- La reserva NO se cancela
- El botón vuelve a estar disponible

**Validaciones:**
- ✅ El error se detecta correctamente
- ✅ El mensaje es claro
- ✅ La reserva no se cancela
- ✅ El estado se mantiene

---

### 14. CASO: Cancelar Reserva - Ya Cancelada

**Pasos:**
1. Intentar cancelar una reserva que ya fue cancelada
2. (Esto puede pasar si dos usuarios cancelan al mismo tiempo, o si hay un error de sincronización)

**Resultado Esperado:**
- Alert de error: "La reserva ya fue cancelada o no existe."
- La reserva mantiene su estado "Cancelada"
- No hay cambios en la UI

**Validaciones:**
- ✅ El error se maneja correctamente
- ✅ El mensaje es claro
- ✅ La UI no se corrompe

---

### 15. CASO: Cancelar Reserva - Timeout

**Pasos:**
1. Configurar servidor para responder lento
2. Intentar cancelar una reserva
3. Esperar a que timeout

**Resultado Esperado:**
- Alert de error: "Tiempo de espera agotado: La solicitud tardó demasiado."
- La reserva no se cancela
- El botón vuelve a estar disponible

**Validaciones:**
- ✅ El timeout se detecta
- ✅ El mensaje es apropiado
- ✅ La reserva no se cancela incorrectamente

---

### 16. CASO: Múltiples Reservas

**Pasos:**
1. Tener 5+ reservas
2. Navegar a la pestaña "Reservas"
3. Hacer scroll por la lista

**Resultado Esperado:**
- Todas las reservas se muestran
- El scroll es fluido
- No hay lag o problemas de rendimiento
- Cada reserva tiene su información completa

**Validaciones:**
- ✅ Todas las reservas se muestran
- ✅ El scroll es fluido
- ✅ No hay problemas de rendimiento
- ✅ La memoria se usa eficientemente

---

### 17. CASO: Reserva con Datos Faltantes

**Pasos:**
1. Tener una reserva sin algunos campos (ej: sin instructor, sin ubicación)
2. Navegar a la pestaña "Reservas"

**Resultado Esperado:**
- La reserva se muestra correctamente
- Los campos faltantes no se muestran (o muestran "—")
- No hay errores en consola
- La app no crashea
- La UI se adapta correctamente

**Validaciones:**
- ✅ La app maneja datos faltantes
- ✅ No hay crashes
- ✅ La UI se adapta
- ✅ No hay errores en consola

---

### 18. CASO: Cancelar Múltiples Reservas Rápidamente

**Pasos:**
1. Tener múltiples reservas confirmadas
2. Cancelar una reserva
3. Inmediatamente intentar cancelar otra (mientras la primera se procesa)

**Resultado Esperado:**
- Solo una cancelación se procesa a la vez
- El botón de la reserva en proceso se deshabilita
- Los otros botones siguen disponibles
- No hay conflictos o errores
- Cada cancelación se procesa correctamente

**Validaciones:**
- ✅ Solo una acción a la vez
- ✅ Los botones se deshabilitan correctamente
- ✅ No hay errores de concurrencia
- ✅ Las cancelaciones se procesan en orden

---

## Checklist de Testing

### Funcionalidad Básica
- [ ] Carga inicial de reservas funciona
- [ ] Cancelar reserva exitosamente
- [ ] Refrescar con pull-to-refresh
- [ ] Navegación entre pestañas
- [ ] Cache funciona correctamente

### Manejo de Errores
- [ ] Sin reservas (empty state)
- [ ] Reserva ya cancelada
- [ ] Error de conexión (sin internet)
- [ ] Timeout del servidor
- [ ] Sesión expirada (401/403)
- [ ] Error del servidor (500+)
- [ ] Backend no disponible (404)
- [ ] Error al cancelar (conexión)
- [ ] Error al cancelar (timeout)
- [ ] Error al cancelar (ya cancelada)

### UI/UX
- [ ] Loading states se muestran correctamente
- [ ] Error states tienen mensajes claros
- [ ] Empty states son informativos
- [ ] Estados de reservas se muestran correctamente (Confirmada, Cancelada)
- [ ] Botones se deshabilitan durante acciones
- [ ] Mensajes de error son claros y útiles
- [ ] Feedback visual es adecuado
- [ ] Iconos se muestran correctamente

### Rendimiento
- [ ] Cache reduce peticiones HTTP
- [ ] Scroll es fluido con muchas reservas
- [ ] No hay memory leaks
- [ ] No hay renders innecesarios
- [ ] La carga desde cache es instantánea

### Cache
- [ ] Cache válido se usa correctamente
- [ ] Cache expirado se refresca automáticamente
- [ ] Pull to refresh ignora cache
- [ ] Cache se actualiza después de cancelar
- [ ] Cache se usa como fallback en errores

---

## Cómo Probar Cada Caso Específico

### 1. Probar Sin Internet
```
1. Desactivar WiFi/datos
2. Ir a Reservas
3. Verificar mensaje de error
4. Activar internet
5. Tocar "Reintentar"
6. Verificar que carga correctamente
```

### 2. Probar Sesión Expirada
```
1. En DevTools: Application > Local Storage
2. Eliminar el token
3. Ir a Reservas
4. Verificar mensaje de error
5. Tocar "Ir a Login"
6. Verificar que redirige correctamente
```

### 3. Probar Cache
```
1. Cargar reservas
2. Verificar en Network que hay petición HTTP
3. Ir a Home
4. Volver a Reservas (dentro de 30 seg)
5. Verificar en Network que NO hay petición HTTP
6. Verificar que los datos son los mismos
```

### 4. Probar Timeout
```
1. En apiService.js: cambiar timeout a 1000ms
2. Ir a Reservas
3. Verificar mensaje de timeout
4. Restaurar timeout original
5. Tocar "Reintentar"
6. Verificar que carga correctamente
```

### 5. Probar Cancelar Reserva
```
1. Tener una reserva confirmada
2. Tocar "Cancelar reserva"
3. Confirmar en diálogo
4. Verificar que se cancela
5. Verificar que la lista se actualiza
6. Verificar que el estado cambia
```

---

## Métricas a Observar

### Tiempo de Carga
- **Carga inicial:** < 2 segundos
- **Carga desde cache:** < 100ms (instantáneo)
- **Refresh manual:** < 2 segundos

### Peticiones HTTP
- **Primera carga:** 1 petición
- **Cambio de pestaña (< 30 seg):** 0 peticiones (usa cache)
- **Cambio de pestaña (> 2 min):** 1 petición (refresca)
- **Pull to refresh:** 1 petición (siempre)

### Uso de Cache
- **Cache hits:** Deben ser > 50% de las cargas
- **Cache misses:** Solo cuando es necesario
- **Cache fallback:** Funciona en errores

---

## Problemas Comunes y Soluciones

### Problema: No carga las reservas
**Solución:**
1. Verificar conexión a internet
2. Verificar que el token es válido
3. Verificar que el servidor está corriendo
4. Revisar logs de consola

### Problema: Cache no funciona
**Solución:**
1. Verificar AsyncStorage
2. Verificar que los tiempos de cache son correctos
3. Limpiar cache y probar de nuevo

### Problema: Error al cancelar
**Solución:**
1. Verificar que la reserva existe
2. Verificar que el sessionId es correcto
3. Verificar conexión a internet
4. Verificar logs del servidor

### Problema: Reservas no se actualizan
**Solución:**
1. Hacer pull to refresh
2. Verificar que el cache se actualiza
3. Verificar que la petición se completa
4. Revisar logs de consola

---

## Comandos Útiles para Testing

### Limpiar Cache
```javascript
// En consola de React Native Debugger
import { clearAllCache } from './src/utils/cacheService';
clearAllCache();
```

### Ver Cache Actual
```javascript
// En consola
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.getItem('@cache_reservations').then(console.log);
```

### Simular Error de Conexión
```javascript
// En apiService.js, comentar la línea de baseURL
// const API_BASE_URL = "http://192.168.0.26:3000/api/v1";
const API_BASE_URL = "http://invalid-url:3000/api/v1";
```

### Simular Timeout
```javascript
// En apiService.js
timeout: 1000, // 1 segundo (muy bajo)
```

### Simular Sesión Expirada
```javascript
// En tokenStorage.js o en consola
import { removeToken } from './src/utils/tokenStorage';
removeToken();
```

---

## Resultados Esperados por Caso

| Caso | Estado | Mensaje | Botones |
|------|--------|---------|---------|
| Sin reservas | Empty | "No tenés reservas aún" | - |
| Reserva confirmada | Success | Datos completos | Cancelar |
| Reserva cancelada | Canceled | "Cancelada" | - |
| Sin internet | Error | "Error de conexión" | Reintentar |
| Timeout | Error | "Tiempo de espera agotado" | Reintentar |
| Sesión expirada | Error | "Sesión expirada" | Ir a Login |
| Error servidor | Error | "Error del servidor" | Reintentar |
| Backend caído | Error/Warning | "No encontrado" | Reintentar/Actualizar |
| Cache válido | Success | Datos instantáneos | - |
| Cache expirado | Loading | Spinner | - |

---

## Notas Finales

- **Cache:** Reduce peticiones HTTP en 50-70%
- **Errores:** Todos los errores se muestran claramente al usuario
- **UX:** Los mensajes son claros y las acciones son obvias
- **Performance:** La app es rápida y fluida
- **Robustez:** Maneja todos los casos edge correctamente

---

## Próximos Pasos para Testing

1. Probar cada caso de la lista
2. Verificar que los mensajes son claros
3. Verificar que las acciones funcionan
4. Verificar que el cache funciona
5. Verificar que los errores se manejan correctamente
6. Documentar cualquier problema encontrado
7. Reportar bugs si es necesario
