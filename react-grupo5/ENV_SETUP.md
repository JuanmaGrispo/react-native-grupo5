# Configuración de Variables de Entorno

## Pasos para configurar tu IP local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Crear archivo `.env`:**
   ```bash
   cp .env.example .env
   ```
   
   O crea manualmente un archivo `.env` en la raíz del proyecto `react-grupo5/`

3. **Editar el archivo `.env`:**
   Abre `.env` y actualiza con tu IP local:
   ```
   API_BASE_URL=http://TU_IP_LOCAL:3000/api/v1
   ```

4. **Encontrar tu IP local:**
   - **Windows:** Abre PowerShell o CMD y ejecuta `ipconfig`. Busca "IPv4 Address" en tu adaptador de red activo.
   - **Mac/Linux:** Ejecuta `ifconfig` o `ip addr` y busca tu dirección IP local (generalmente empieza con 192.168.x.x o 10.0.x.x)

5. **Ejemplo:**
   Si tu IP es `192.168.1.100`, tu `.env` debería verse así:
   ```
   API_BASE_URL=http://192.168.1.100:3000/api/v1
   ```

6. **Reiniciar el servidor de Expo:**
   Después de crear/editar el `.env`, reinicia Expo:
   ```bash
   npm start
   ```
   O presiona `r` en la terminal de Expo para recargar.

## Notas importantes

- El archivo `.env` está en `.gitignore` y **NO se subirá al repositorio**
- Cada desarrollador debe crear su propio archivo `.env` con su IP local
- El archivo `.env.example` es solo un template de referencia
- Si no configuras `.env`, la app usará `http://localhost:3000/api/v1` por defecto

