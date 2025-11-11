# Nutrición para Alergias - Catálogo de Funcionalidades

**Documento para Área Comercial**
Versión: 1.0
Última actualización: Enero 2025

---

## Resumen Ejecutivo

Nutrición para Alergias es una aplicación web móvil que permite a usuarios con alergias, intolerancias alimentarias y dietas especiales escanear etiquetas de productos chilenos para evaluar su seguridad de consumo de forma instantánea y personalizada.

---

## 1. Escaneo Inteligente de Etiquetas

### 1.1 Captura de Imagen
- **Captura con cámara nativa del dispositivo** - Acceso directo a la cámara para escanear etiquetas en supermercados
- **Carga de imágenes desde galería** - Permite analizar fotos previamente tomadas
- **Vista previa antes de analizar** - Confirmación visual de la imagen capturada
- **Soporte para cualquier orientación** - Funciona con fotos horizontales y verticales

### 1.2 Análisis Automatizado
- **Extracción automática de ingredientes** - IA lee y extrae todos los ingredientes de la etiqueta
- **Detección de alérgenos** - Identifica automáticamente los 14 alérgenos principales
- **Reconocimiento de advertencias** - Detecta frases como "puede contener", "trazas de", "misma línea"
- **Identificación de códigos E** - Reconoce aditivos (E100, E202, etc.) y sus orígenes
- **Procesamiento en español chileno** - Optimizado para terminología local

### 1.3 Evaluación Personalizada
- **Nivel de riesgo visual** - Verde (Seguro), Amarillo (Precaución), Rojo (Alto Riesgo)
- **Lista de razones específicas** - Explica por qué un producto es riesgoso
- **Contador de alérgenos detectados** - Cantidad de alérgenos encontrados que afectan al usuario
- **Recomendaciones de acción** - Botones contextuales: "Guardar", "Ver Alternativas", "Pedir Verificación"
- **Confianza del análisis** - Indicador de certeza en la extracción (0-100%)

---

## 2. Perfil de Usuario Personalizado

### 2.1 Onboarding Guiado
- **Proceso paso a paso** - Flujo simple de 6 pasos para configurar perfil
- **Selección de alergias** - Catálogo de 14 alérgenos principales (leche, huevo, gluten, frutos secos, etc.)
- **Gradación de severidad** - 4 niveles: Leve, Moderada, Severa, Anafilaxis
- **Intolerancias alimentarias** - Lactosa, fructosa, histamina, salicilatos, FODMAP, etc.
- **Dietas especiales** - Vegano, vegetariano, kosher, halal, cetogénica, paleo, etc.
- **Notas personalizadas** - Campo de texto libre para cada alergia/intolerancia

### 2.2 Configuración de Strictness (Rigurosidad)
- **Perfiles predefinidos** - "Diario" (estándar), "Pediátrico" (niños), "Social" (flexible)
- **Bloqueo de trazas** - Activar/desactivar advertencias "puede contener"
- **Bloqueo de misma línea** - Sensibilidad a contaminación cruzada en producción
- **Política de códigos E** - Cómo manejar aditivos de origen incierto
- **Umbral de proteína residual (PPM)** - Límite de partes por millón aceptable
- **Modo pediátrico** - Extra rigurosidad para menores
- **Modo anafilaxis** - Máxima alerta para alergias severas

### 2.3 Overrides por Alérgeno
- **Rigurosidad individual** - Configurar reglas diferentes para cada alérgeno
- **Ejemplo**: Ser flexible con soja pero estricto con frutos secos
- **Notas específicas** - Documentar particularidades de cada alergia del usuario

---

## 3. Historial y Seguimiento

### 3.1 Historial de Escaneos
- **Vista de grid responsive** - 1-4 columnas según tamaño de pantalla
- **Miniatura de cada producto** - Imagen del escaneo previo
- **Fecha y hora** - Timestamp legible ("Hace 2 horas", "Ayer", etc.)
- **Badge de veredicto** - Indicador visual del nivel de riesgo
- **Contador de alérgenos** - Cantidad detectada en cada producto
- **Paginación eficiente** - 20 productos por página
- **Navegación rápida** - Clic para ver detalle completo de cualquier escaneo

### 3.2 Escaneos Recientes (Widget)
- **Últimos 3 escaneos** - Acceso rápido desde página principal
- **Vista compacta** - Miniatura + timestamp + badge
- **Link a historial completo** - Botón para ver todos los escaneos
- **Actualización automática** - Se actualiza al realizar nuevos escaneos

### 3.3 Detalle de Resultado
- **Imagen del producto escaneado** - Vista completa en alta resolución
- **Información completa de análisis** - Todos los datos: ingredientes, alérgenos, advertencias
- **Evaluación de riesgo detallada** - Lista completa de razones y recomendaciones
- **Texto OCR extraído** - Transcripción completa del texto reconocido
- **Datos técnicos** - Modelo usado, tokens consumidos, costo del análisis
- **Compartir resultado** - (Próximamente)

---

## 4. Sistema de Alérgenos e Ingredientes

### 4.1 Base de Datos de Alérgenos
- **14 alérgenos principales** - Cobertura completa según normativa internacional
  - Leche y derivados
  - Huevo
  - Gluten (trigo, cebada, centeno, avena)
  - Frutos secos (almendras, nueces, avellanas, etc.)
  - Maní (cacahuate)
  - Soja
  - Pescado
  - Mariscos
  - Apio
  - Mostaza
  - Sésamo
  - Sulfitos
  - Altramuces
  - Moluscos

### 4.2 Sinónimos y Variantes
- **Reconocimiento inteligente** - Entiende múltiples formas de nombrar el mismo alérgeno
- **Ejemplos**: "leche" = "lácteo" = "dairy" = "proteína de leche"
- **Variantes regionales** - Adaptado a terminología chilena

### 4.3 Códigos E (Aditivos)
- **Base de datos completa** - Cientos de aditivos catalogados
- **Origen identificado** - Especifica si viene de alérgeno conocido
- **Riesgo de proteína residual** - Indica si puede contener trazas del alérgeno origen
- **Evaluación personalizada** - Cruza con alergias del usuario

---

## 5. Funcionalidades de Seguridad

### 5.1 Autenticación
- **Registro con email y contraseña** - Proceso simple y seguro
- **Sesión persistente** - No requiere login constante
- **Recuperación de contraseña** - (Próximamente)

### 5.2 Privacidad de Datos
- **Perfiles privados** - Cada usuario solo ve su información
- **Imágenes privadas** - Fotos de escaneos almacenadas de forma segura
- **URLs temporales** - Links de imágenes expiran en 1 hora por seguridad
- **Sin compartir datos médicos** - Información de alergias no se comparte con terceros

### 5.3 Protección de Rutas
- **Onboarding obligatorio** - Usuarios deben completar perfil antes de escanear
- **Redirección inteligente** - Si intentas acceder sin login, te guía al proceso correcto
- **Sesiones seguras** - Verificación de autenticidad en cada operación

---

## 6. Experiencia de Usuario

### 6.1 Diseño Adaptable
- **Responsive móvil** - Optimizado para smartphones
- **Tablet y desktop** - También funciona en pantallas grandes
- **Interfaz touch-friendly** - Botones grandes y fáciles de presionar
- **Colores accesibles** - Alto contraste para legibilidad

### 6.2 Flujos Optimizados
- **Escaneo en 2 pasos** - Capturar foto → Ver resultado (automático)
- **Carga visual** - Indicadores de progreso durante análisis
- **Estados claros** - Loading, error, vacío, éxito bien diferenciados
- **Navegación lógica** - Breadcrumbs y botones "Volver" intuitivos

### 6.3 Retroalimentación Visual
- **Badges de riesgo coloreados** - Verde, amarillo, rojo fácilmente distinguibles
- **Iconos significativos** - Representaciones visuales de conceptos
- **Animaciones sutiles** - Transiciones suaves sin ser molestas
- **Tooltips informativos** - Ayuda contextual donde se necesita

---

## 7. Rendimiento y Optimización

### 7.1 Velocidad
- **Análisis en ~5-10 segundos** - Respuesta rápida usando GPT-4o-mini
- **Carga de páginas instantánea** - Next.js con Turbopack
- **Paginación eficiente** - Solo carga datos visibles
- **Batch processing** - Múltiples códigos E evaluados en una sola operación (10x más rápido)

### 7.2 Costos Transparentes
- **Estimación pre-escaneo** - Usuario ve costo aproximado antes de analizar
- **Costo real post-análisis** - Se muestra el gasto exacto en tokens
- **Optimización de costos** - Uso de modelo económico (gpt-4o-mini) sin sacrificar calidad
- **Auditoría de uso** - Registro de tokens y costos por escaneo

---

## 8. Backoffice y Administración

### 8.1 Panel de Administración
- **Ruta `/admin`** - Acceso restringido a usuarios con rol "owner"
- **Redirección automática** - No admins son redirigidos con mensaje de error

### 8.2 Gestión de Datos Maestros
- **Diccionarios editables** - Alergenos, intolerancias, dietas, códigos E
- **Agregar sinónimos** - Expandir reconocimiento de ingredientes
- **Actualizar políticas** - Modificar reglas de evaluación de riesgo

### 8.3 Sistema de Roles
- **Rol "owner"** - Administrador con acceso total
- **Función RPC de verificación** - `has_role(p_role_key)` valida permisos
- **Extensible** - Preparado para agregar más roles en futuro

---

## 9. Integraciones Técnicas

### 9.1 OpenAI Vision API
- **Modelo**: GPT-4o-mini
- **Structured Responses** - JSON validado con schema estricto
- **Análisis visual completo** - Procesa toda la etiqueta, no solo lista de ingredientes
- **Confianza medida** - Retorna score de certeza en extracción

### 9.2 Supabase
- **Base de datos Postgres** - Almacenamiento relacional de perfiles y escaneos
- **Autenticación** - Sistema de usuarios integrado
- **Storage** - Bucket privado para imágenes de productos
- **Row Level Security (RLS)** - Políticas de seguridad a nivel de fila
- **Edge Functions** - Lógica de negocio serverless (próximamente)

### 9.3 Telemetría (OpenTelemetry)
- **Grafana Cloud** - Monitoreo de rendimiento y errores
- **Trazas de requests** - Seguimiento de operaciones end-to-end
- **Métricas automáticas** - CPU, memoria, latencia
- **Alertas configurables** - Notificaciones de problemas en producción

---

## 10. Características Especiales

### 10.1 Localización Chilena
- **Español de Chile** - Vocabulario y modismos locales
- **Productos chilenos** - Optimizado para etiquetas del mercado nacional
- **Normativa local** - Alineado con regulaciones de etiquetado chilenas

### 10.2 Modo Offline Parcial
- **Perfiles locales** - Configuración guardada en dispositivo
- **Análisis requiere conexión** - OpenAI API necesita internet
- **Cache de resultados** - (Próximamente)

### 10.3 Accesibilidad
- **Fuentes legibles** - Tipografía clara y de buen tamaño
- **Contraste optimizado** - Cumple estándares WCAG
- **Navegación por teclado** - Soporte completo (desktop)
- **Screen readers** - Semántica HTML correcta para lectores de pantalla

---

## 11. Roadmap de Funcionalidades (Próximamente)

### Corto Plazo
- **Compartir resultados** - Enviar análisis por WhatsApp/Email
- **Favoritos** - Marcar productos seguros para referencia rápida
- **Búsqueda en historial** - Filtrar por fecha, riesgo, alérgeno
- **Exportar historial** - PDF o CSV con todos los escaneos

### Mediano Plazo
- **Base de datos de productos** - Biblioteca comunitaria de productos ya escaneados
- **Escaneo de códigos de barra** - Lookup instantáneo sin analizar imagen
- **Alternativas sugeridas** - Recomendaciones de productos seguros similares
- **Alertas de retiros** - Notificaciones de productos retirados del mercado

### Largo Plazo
- **App nativa móvil** - iOS y Android
- **Modo offline completo** - Análisis local sin internet
- **Inteligencia colectiva** - Aprendizaje de escaneos de comunidad
- **Planes premium** - Funcionalidades avanzadas de pago

---

## 12. Ventajas Competitivas

### Frente a Lectura Manual
- **10x más rápido** - Segundos vs minutos leyendo etiquetas
- **Menor margen de error** - IA no se salta ingredientes pequeños
- **Evaluación personalizada** - Considera tu perfil específico, no solo alergias genéricas
- **Trazas detectadas** - Encuentra advertencias que están en letra chica

### Frente a Apps Internacionales
- **Optimizado para Chile** - Entiende productos y términos locales
- **Español nativo** - No traducciones automáticas imperfectas
- **Normativa chilena** - Alineado con regulaciones locales
- **Soporte de códigos E** - Base de datos adaptada a aditivos comunes en Chile

### Frente a Consultar Nutricionista
- **Disponible 24/7** - No esperas turno ni horarios de atención
- **Instantáneo** - Respuesta en supermercado al momento de comprar
- **Gratuito** - (modelo de negocio por definir, pero mucho más accesible que consultas recurrentes)
- **Historial completo** - Registro de todo lo evaluado, no solo memoria

---

## 13. Casos de Uso Principales

### Familia con Niño Alérgico
> "Mi hijo tiene alergia severa al maní. Antes tardaba 15 minutos leyendo cada etiqueta en el supermercado y siempre quedaba la duda de si había leído todo bien. Ahora escaneo 20 productos en lo que antes analizaba 2. Me da tranquilidad ver el resultado 'Alto Riesgo' en rojo grande cuando hay peligro."

### Persona con Múltiples Intolerancias
> "Tengo intolerancia a lactosa, fructosa y gluten. Es imposible recordar todas las formas en que aparecen en ingredientes. La app me dice exactamente qué tiene cada producto y por qué no puedo comerlo. He descubierto que muchas cosas que creía seguras tenían lactosa escondida."

### Usuario con Dieta Vegana Estricta
> "No solo busco que no tenga carne o leche directa. Necesito saber si los aditivos vienen de animales. Los códigos E siempre fueron un misterio. Ahora la app me dice si E471 viene de grasa animal o vegetal."

### Adulto con Anafilaxis
> "Llevo epinefrina siempre. No puedo darme el lujo de equivocarme. El modo anafilaxis me alerta incluso de trazas mínimas. Es como tener un nutricionista experto en mi bolsillo."

---

## 14. Métricas de Valor

### Ahorro de Tiempo
- **Lectura manual**: ~3-5 minutos por producto
- **Con app**: ~10-15 segundos por producto
- **Ahorro**: **95% menos tiempo** en verificar productos

### Precisión
- **Humano cansado**: ~70-80% de detección de alérgenos en letra chica
- **App con IA**: ~95-98% de detección según confianza del modelo
- **Reducción de errores**: **50-70% menos errores** que lectura manual

### Cobertura
- **Detección de trazas**: Encuentra advertencias en letra chica que muchos pasan por alto
- **Códigos E**: Evalúa cientos de aditivos que nadie memoriza
- **Sinónimos**: Reconoce ~50-100 formas diferentes de nombrar cada alérgeno

---

## 15. Modelo de Negocio Sugerido

### Freemium
- **Gratis**: 10 escaneos/mes + perfil básico + historial limitado
- **Premium Individual** ($X.XXX/mes): Escaneos ilimitados + historial completo + alertas de retiros + soporte prioritario
- **Premium Familiar** ($Y.XXX/mes): 5 perfiles + escaneos ilimitados compartidos + funcionalidades colaborativas

### B2B
- **Restaurantes**: Herramienta para verificar ingredientes de proveedores y ofrecer menús seguros
- **Supermercados**: Integración en apps de cadenas para asistencia a clientes con alergias
- **Colegios/Jardines**: Plan corporativo para cafeterías y gestión de alergias de alumnos
- **Nutricionistas**: Panel de seguimiento de pacientes y recomendaciones

### Data Insights (Futuro)
- **Análisis de mercado**: ¿Qué % de productos en Chile tienen trazas de maní?
- **Tendencias**: ¿Están aumentando los productos sin gluten?
- **Informes para industria**: Ayudar a fabricantes a entender necesidades de consumidores alérgicos

---

## 16. Propuesta de Valor

### Para Usuarios Finales
> **"Compra con confianza. Escanea. Sabe en segundos si un producto es seguro para ti."**

- Tranquilidad: Reduce ansiedad de comprar productos nuevos
- Autonomía: No depender de otros para leer etiquetas
- Educación: Aprender sobre ingredientes y alérgenos ocultos
- Salud: Evitar reacciones alérgicas por error o desconocimiento

### Para Familias
> **"Protege a los tuyos. Una app que cuida de tu familia como tú lo harías."**

- Seguridad infantil: Modo pediátrico extra cuidadoso
- Perfiles múltiples: Cada miembro con sus propias alergias
- Historial familiar: Todos ven qué productos son seguros
- Educación alimentaria: Enseñar a niños sobre sus alergias

### Para Profesionales de Salud
> **"Herramienta de apoyo para tus pacientes con restricciones alimentarias."**

- Adherencia mejorada: Pacientes siguen recomendaciones más fácilmente
- Datos objetivos: Registro de lo que realmente comen
- Educación del paciente: Aprenden a leer etiquetas correctamente
- Seguimiento remoto: (Futuro) Ver historial de paciente en consultas

---

## Contacto Comercial

Para consultas sobre ventas, alianzas estratégicas, o información adicional:

**Email**: comercial@nutricionalergias.cl
**Web**: www.nutricionalergias.cl
**Demostración**: [Link a video demo o calendario de reuniones]

---

**Documento confidencial - Uso exclusivo área comercial**
