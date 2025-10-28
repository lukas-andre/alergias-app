# Progress — Nutrición para Alergias

## 2025-10-27
- Reemplazado OCR local con integración OpenAI Responses (json_schema estricto) según backlog/openai-integration.md.
- Endpoint `/api/analyze` convierte imágenes a base64, invoca `extractIngredientsJSONViaSDK` y retorna JSON estructurado + métricas.
- UI de `/scan` actualizada: estados de carga, chips de ingredientes/alérgenos, advertencias, métricas de costo y paneles raw/estimación.
- Añadidos estimadores de costo dinámica en `lib/openai/cost-estimator.ts` y esquema vision helper en `lib/openai/vision.ts`.
- Ajustados estilos y landing para reflejar flujo OpenAI; README y `.env.example` documentan nueva configuración.

## Next Steps
- Validar con más etiquetas reales: comparar JSON vs. expectativa manual.
- Añadir persistencia/historial (localStorage o Supabase) y reglas de tráfico de color para MVP1.
- Incluir manejo de timeouts/reintentos en `/api/analyze` y telemetría básica.
