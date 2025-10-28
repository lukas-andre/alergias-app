## Nutrición para Alergias — MVP 0 (OpenAI)

Aplicación Next.js que captura etiquetas de productos chilenos, envía la foto a la API de OpenAI y recibe un **JSON estructurado** con ingredientes, alérgenos, advertencias y metadatos de confianza.

### Características clave
- Captura desde cámara o galería (`<input type="file" capture="environment">`) con vista previa inmediata y medición de dimensiones antes de subir.
- Integración con OpenAI Responses API usando `response_format: json_schema` para garantizar la estructura del resultado.
- Estimación automática de costos/tokenización según las reglas dinámicas del backlog.
- UI mobile-first: chips de ingredientes/alérgenos, métricas (confianza, idioma, costo) y paneles desplegables con `usage` y estimación previa.

### Requisitos
- Node.js 18 o superior
- npm (incluido con Node)
- Crear un `.env` con `OPENAI_API_KEY` (véase `.env.example`)

### Scripts disponibles
- `npm run dev` — inicia el servidor de desarrollo en `http://localhost:3000`.
- `npm run build` — genera el build de producción.
- `npm run start` — ejecuta el build de producción.
- `npm run lint` — ejecuta ESLint con la configuración de Next.js.

### Estructura destacada
- `app/page.tsx` — landing con CTA y explicación del flujo OpenAI.
- `app/scan/page.tsx` — manejo de selección, preview, subida y render de resultados JSON.
- `app/api/analyze/route.ts` — endpoint que transforma la imagen a base64 y llama a OpenAI.
- `components/ImagePicker.tsx` — cliente para seleccionar/limpiar imágenes.
- `components/AnalysisResult.tsx` — renderiza ingredientes, alérgenos, métricas y raw JSON.
- `lib/openai/cost-estimator.ts` — lógica de tiles/tokens y cálculo de costos dinámico.
- `lib/openai/vision.ts` — llamada tipada al SDK de OpenAI con schema estricto.
- `lib/parse.ts` — heurística previa (MVP1) conservada por si se reutiliza en reglas locales.

### Flujo de uso
1. Arranca el dev server (`npm run dev`) y visita `/scan`.
2. Presiona “Abrir cámara o galería” y selecciona una foto enfocada del bloque de ingredientes.
3. El backend envía la imagen a OpenAI y devuelve JSON estructurado; la UI muestra chips, alérgenos, advertencias y confianza.
4. Revisa los detalles desplegables para ver el texto crudo, `usage` reportado por OpenAI y la estimación previa calculada con las reglas del backlog.

### Próximos pasos sugeridos (MVP 1+)
1. Persistir el JSON en localStorage/Supabase para historial y posterior análisis de alérgenos.
2. Conectar `lib/parse.ts` + diccionario de sinónimos para colorear ingredientes sin depender de OpenAI.
3. Añadir controles de transparencia: indicador de envío a terceros, toggle de idioma, feedback del usuario.
4. Crear scripts de pruebas manuales con fotos reales (≥5 productos) y registrar costo real vs. estimado.
