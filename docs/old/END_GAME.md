¡Qué buen avance, Lucas! Tu demo ya está muy por encima del promedio. Si quieres que sea **única, útil y monetizable**, aquí va un brainstorming curado y priorizado—con ideas concretas de “qué”, “por qué” y “cómo” (IA/RAG/reglas) para que puedas armar un roadmap sin perder foco.

# Visión

**5 segundos para saber si puedo comer esto.**
Escaneo (etiqueta/plato/menú) → señal tipo semáforo + explicación breve + opciones (guardar, reportar, alternativas cerca).

---

# Diferenciadores “wow” (prioridad alta)

1. **Perfil + Modo Estricto Personalizado**

   * *Qué:* alergias, intolerancias, dieta (vegano/low-FODMAP/embarazo/halal), niveles de estrictitud (proteína residual, trazas, “misma línea”).
   * *Cómo:* reglas + LLM que ajusta umbrales y mensajes según perfil (“modo pediátrico”, “modo anafilaxia”).

2. **Score de Riesgo Multifactor** (explicable)

   * *Qué:* combinar “contiene”, “puede contener”, E-numbers de origen incierto, país de fabricación, claims (“sin gluten”), y confianza del OCR/LLM.
   * *Cómo:* motor de reglas + pesos; output semáforo + *Por qué*: resalta tokens encontrados (“lecitina (E322)”, “trazas de nuez”).

3. **Explicabilidad con citas**

   * *Qué:* cada alerta muestra la evidencia: fragmento de etiqueta + fuente de conocimiento (RAG).
   * *Cómo:* LLM genera explicación corta con enlaces/citas a tu base (Open Food Facts, guías oficiales, tu tabla de E-numbers).

4. **Escáner de platos (foto)** (beta, “orientativo”)

   * *Qué:* foto de comida → top N platos probables + alérgenos frecuentes de ese plato.
   * *Cómo:* clasificador visión (food-101/recipes datasets) + RAG de “ingredientes típicos por plato” (ej.: “tallarines a la bolognesa → gluten, lácteos si lleva queso”).

5. **Verificador de menús** (PDF/URL)

   * *Qué:* subes una carta o pegas un link → resaltado de platos riesgo y *safe picks* según tu perfil.
   * *Cómo:* OCR/HTML parse → normalización → matching con tu taxonomía de platos/ingredientes.

6. **Mapa de “lugares seguros”**

   * *Qué:* tiendas/restoranes con opciones claras, filtros por ciudad, etiquetas (“gluten-free dedicado”, “sin frutos secos”).
   * *Cómo:* seed propio + contribución de usuarios moderada + reputación/karma.

7. **Tarjeta de emergencia + traducción instantánea**

   * *Qué:* “Tengo alergia a X. Por favor eviten Y/Z.” en ES/EN/PT/FR; QR con perfil médico.
   * *Cómo:* plantillas + LLM para traducción segura (lista blanca de términos controlados).

8. **Alternativas seguras**

   * *Qué:* si un producto es riesgoso, sugerir 2-3 sustitutos seguros (misma categoría).
   * *Cómo:* embeddings de productos + etiquetas nutricionales y “free-from”.

9. **Verificador de reseñas/comunidad con IA**

   * *Qué:* consolidar reportes de usuarios y resúmenes “esta marca cambió receta en 2025-Q3”.
   * *Cómo:* RAG + moderación + señales de confiabilidad.

10. **Modo offline (parcial)**

* *Qué:* diccionarios, E-numbers y reglas mínimas en el dispositivo; cola de sincronización.
* *Cómo:* bundle JSON + wasm; sube a nube cuando haya conexión.

---

# Catálogo base de alérgenos (ES-CL) para tu diccionario

* **Gluten** → trigo, cebada, centeno, **avena** (y “sin TACC”), espelta, malta.
* **Leche/lácteos** → leche, suero, caseína/caseinato, lactoalbúmina, mantequilla, ghee, lactosa (intolerancia ≠ proteína).
* **Huevo** → albúmina, lisozima, ovomucoide, yema/clara.
* **Soja/soya** → lecitina (E322), proteína de soya/aislado, aceite (refinado vs no).
* **Maní** (peanut) → cacahuate/maní, aceite de maní.
* **Frutos secos** → nuez, almendra, avellana, castaña de cajú (anacardo), pistacho, pecana, macadamia.
* **Sésamo** → ajonjolí, tahini.
* **Pescado** y **Mariscos** → camarón, langostino, cangrejo, ostión, almeja, calamar, mejillón, etc.
* **Mostaza**, **Apio**, **Lupino/Lupín**, **Sulfitos** (≥10 mg/kg o L)
* **Otros frecuentes** (según perfil): maíz, chocolate/cacao, *nightshades* (papa, tomate), **FODMAP** (fructanos, polioles).

> Añade sinónimos chilenos y marcas locales comunes. Guarda “falsos amigos” (p.ej., **malta** = cebada → gluten).

---

# IA + RAG: qué indexar desde ya

* **Open Food Facts** (productos, ingredientes, alérgenos, trazas, cambios de receta).
* **Tabla de E-numbers** enriquecida**:** código, nombres, **origen posible** (animal/vegetal/sintético), notas (“riesgo si proteína residual”), fuentes.
* **Taxonomía de platos típicos** (Chile/LatAm + internacionales) con ingredientes frecuentes y alérgenos probables.
* **Sinónimos ES-CL** (lemmas, variantes ortográficas) + normalizador (diacríticos, mayúsculas).
* **Glosario de etiquetas**: “libre de”, “en la misma línea”, “trazas”, “puede contener”.
* **Historial de cambios** por marca/producto (cuando usuarios reporten receta nueva).
* **Listas blancas** (facilitan “alternativas seguras”).

---

# Pipeline recomendado (híbrido y explicable)

1. **Ingesta** (foto/URL/PDF) → preprocesado (opcional OpenCV.js).
2. **LLM-Visión** → JSON estructurado (ingredientes[], alérgenos declarados, trazas, E-codes, claims, confianza).
3. **Normalizador** → lemas + de-dup + mapeo a tu taxonomía.
4. **Motor de reglas** → contiene/puede contener/instalación; E-numbers con origen incierto.
5. **RAG** → enriquecer (notas, fuentes, alternativas).
6. **Riesgo + Confianza** → semáforo + “Por qué lo decimos”.
7. **Acciones** → guardar, compartir, alternativas, reportar error.

*Tip:* guarda **el fragmento de la etiqueta** que disparó cada alerta para máxima confianza de usuario.

---

# Backlog de features (con “por qué” y “cómo”)

**Core (S)**

* Scanner etiqueta + chips (listo en tu POC).
* Diccionario ES-CL + reglas básicas.
* “Por qué” con highlights (token → alerta).

**Alto impacto (M)**

* Score de riesgo y estrictitud personalizada.
* E-numbers con notas de origen y *edge cases* (E471, E120, E542…).
* **Menú/PDF/URL** parser.
* **Escáner de platos** (beta), marcado como “orientativo”.
* **Alternativas seguras** (k-NN por embeddings).

**Crecimiento (M/L)**

* Mapa de lugares seguros + filtros.
* Comunidad: reportes, cambios de receta, karma.
* Tarjeta de emergencia + traducción.
* Recibos/carro: subir boleta y auto-agregar a historial.
* Lotes/fechas: comparar lote vs reportes de la comunidad.

**Confiabilidad/ops (S/M)**

* Modo offline parcial.
* Telemetría de confianza (tasa de ediciones, *false positives*).
* Revisión humana asistida para “banderas rojas” (active learning).

---

# UX y comunicación (claridad > miedo)

* **Semáforo + icono + 1 frase** (“Riesgo alto: encontramos ‘caseinato’”).
* Botón **“Muéstrame el porqué”** → chips con tokens y citas.
* **Modo niños**: lenguaje simple, recomendaciones prácticas.
* **Disclaimer** constante: “Guía de apoyo, no reemplaza indicación médica.”
* **Reportar error** siempre visible (mejora el modelo y construye confianza).

---

# Monetización (rápida y limpia)

* **Freemium**: X scans/mes, semáforo básico, guardar 10 productos.
* **Pro (USD 2–5/mes)**: ilimitado, menús/PDF, escáner de platos, alternativas, tarjeta de emergencia, modo offline, perfiles familiares.
* **B2B**:

  * Restaurantes: verificador de carta y sello “mapa seguro”.
  * Retail/marketplaces: widget de semáforo en ficha de producto.
* **Afiliados**: links a productos “free-from”.
* **Community data**: insights anónimos (tendencias, cambios de recetas) para marcas—respetando privacidad.

---

# Esquemas útiles (para que tu LLM salga “siempre” estructurado)

**IngredientExtractionResult**

```json
{
  "product": {"name": null, "brand": null, "barcode": null},
  "raw_text": "…",
  "ingredients": [
    {
      "surface": "lecitina de soya (E322)",
      "canonical": "lecitina de soja",
      "allergens": ["soja"],
      "e_numbers": ["E322"],
      "flags": ["emulsifier"],
      "evidence_span": [123, 145],
      "confidence": 0.91
    }
  ],
  "declared_allergens": ["leche", "soja"],
  "traces": ["maní", "nueces"],
  "claims": ["sin gluten"],
  "ocr_confidence": 0.86,
  "vision_confidence": 0.9
}
```

**UserProfile (strictness & preferencias)**

```json
{
  "user_id": "…",
  "allergens": ["gluten", "leche", "soja"],
  "intolerances": ["lactosa"],
  "diet": ["vegetariano"],
  "strictness": {"trazas": true, "misma_linea": true, "e_numbers_origin_uncertain": "block"},
  "languages": ["es","en"]
}
```

**RiskOutput**

```json
{
  "risk": "high|medium|low",
  "reasons": [
    {"type":"contains", "token":"caseinato", "allergen":"leche"},
    {"type":"trace", "token":"puede contener nueces", "allergen":"frutos secos"},
    {"type":"e_number_uncertain", "token":"E471"}
  ],
  "confidence": 0.88,
  "actions": ["guardar","ver alternativas","ver mapa cercano"]
}
```

---

# Roadmap sugerido (8–10 semanas)

**Semana 1–2 (MVP 0.5):** motor de reglas + explicabilidad + perfiles con estrictitud.
**Semana 3–4 (MVP 1):** E-numbers con notas (RAG) + alternativas seguras.
**Semana 5–6 (MVP 2):** menú/PDF/URL; seed del mapa (20 locales).
**Semana 7–8 (MVP 3):** escáner de platos (beta) + tarjeta de emergencia + traducción.
**Semana 9–10 (hardening):** offline parcial, telemetría de confianza, community reports.

---

# Detalles “pro” que suman

* **Hash de etiqueta** (perceptual hash) para cachear resultados y bajar costos.
* **Versionado de receta**: si cambia la lista de ingredientes, notificar a quienes lo guardaron.
* **Canales de riesgo**: anafilaxia vs. intolerancia (mensaje distinto).
* **A11Y**: no dependas solo de color; iconos + texto.
* **Privacidad primero**: por defecto no subes fotos; si usas LLM remoto, avisa claro y borra tras inferencia.

---

Si te sirve, próximo paso te armo:

* la **taxonomía ES-CL** inicial (JSON) con sinónimos,
* la **tabla base de E-numbers** (campos y ejemplos),
* y un **prompt de función** para que 4o-mini devuelva exactamente los JSON de arriba.
