# Instrucciones de Desarrollo Definitivas (AG Servicios Inmobiliarios)

Este archivo contiene la configuración crítica y directrices indispensables del proyecto para prevenir cualquier tipo de regresión, pérdida de datos u optimizaciones incorrectas en futuras ediciones por agentes de Inteligencia Artificial o desarrolladores.

## 🚨 REGLAS CRÍTICAS DE ACTIVOS (NO SOBRESCRIBIR VIDEOS)

1. **PROHIBIDO Re-generar Videos**: 
   * Los videos ubicados en `/public/videos/` y `/public/inmuebles/terrenos/` son los **videos reales de producción de alta resolución de la inmobiliaria**.
   * Bajo ninguna circunstancia se debe ejecutar ningún script `build-videos.ts` o comandos de `ffmpeg` para reemplazar estos archivos con placeholders sintéticos, diapositivas estáticas o videos de baja calidad creados en el momento.
   * Cualquier actualización futura debe preservar los archivos multimedia existentes intactos.

2. **Evitar Pérdidas de Caché (Cache-Busting)**:
   * En `src/components/AcarayLandingPage.tsx`, las fuentes de los reproductores de video (`<video>`) implementan un parámetro de versión de caché (`?v=20260605-v15`).
   * Este parámetro es indispensable para asegurarse de que los navegadores e iframes carguen los videos reales indexados y omitan cualquier caché residual de flujos corruptos generados previamente. Preserva esta lógica en futuros cambios de componentes.

3. **Configuración de Transmisión del Servidor (`server.ts`)**:
   * El servidor Express debe mantener habilitado el soporte CORS completo (`Access-Control-Allow-Origin: *`) para que los recursos multimedia carguen correctamente en los visores del iframe o plataformas externas.
   * La cabecera `maxAge` de archivos estáticos está configurada en `0` para desarrollo y testeo activo para prevenir el almacenamiento en caché local de archivos multimedia dañados o desactualizados.

---

## 🌐 CONFIGURACIÓN GENERADA PARA PRODUCCIÓN Y SEO

* **Robots y Sitemaps**: Creados y ubicados en `/public/robots.txt` y `/public/sitemap.xml` apuntando a la dirección de producción. Al migrar al nuevo dominio personalizado, estos archivos deben actualizarse para reflejar el hosting canonical final.
* **Compatibilidad de Formato**: Todos los videos de terrenos (`terreno-venta1_compat.mp4`) están optimizados en formato H.264/AAC con perfil de compatibilidad web cruzado (Android, iOS, Safari, Chrome).
