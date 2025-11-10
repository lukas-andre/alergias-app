/**
 * Admin Panel Translations (Spanish - Chilean)
 *
 * Centralized translation strings for the admin interface.
 * Following best practices for i18n readiness.
 */

export const adminTranslations = {
  // Common
  common: {
    search: "Buscar...",
    loading: "Cargando...",
    cancel: "Cancelar",
    save: "Guardar",
    create: "Crear",
    edit: "Editar",
    update: "Actualizar",
    delete: "Eliminar",
    add: "Agregar",
    saving: "Guardando...",
    yes: "Sí",
    no: "No",
    none: "Ninguno",
    unknown: "Desconocido",
    noData: "No se encontraron datos.",
    actions: "Acciones",
    viewDetails: "Ver Detalles",
    clearFilters: "Limpiar Filtros",
  },

  // Navigation
  nav: {
    dashboard: "Panel de Control",
    eNumbers: "Números E",
    dictionaries: "Diccionarios",
    synonyms: "Sinónimos",
    settings: "Configuración",
    auditLog: "Registro de Auditoría",
    backToApp: "← Volver a la App",
    priority1: "Prioridad 1",
  },

  // Layout
  layout: {
    adminPanel: "Panel de Administración",
    manageDictionaries: "Gestionar diccionarios y configuraciones",
  },

  // Dashboard
  dashboard: {
    title: "Panel de Control",
    description: "Resumen de datos de diccionarios y sistema",
    eNumbersCard: "Números E",
    eNumbersDesc: "Aditivos registrados",
    allergensCard: "Tipos de Alérgenos",
    allergensDesc: "Entradas del diccionario de alérgenos",
    dietsCard: "Tipos de Dietas",
    dietsDesc: "Categorías de dietas disponibles",
    intolerancesCard: "Tipos de Intolerancias",
    intolerancesDesc: "Entradas del diccionario de intolerancias",
    synonymsCard: "Sinónimos",
    synonymsDesc: "Sinónimos de alérgenos para coincidencias",
    quickActions: "Acciones Rápidas",
    quickActionsDesc: "Tareas administrativas comunes",
    manageENumbers: "Gestionar Números E",
    manageENumbersDesc: "Agregar, editar o eliminar aditivos alimentarios",
    editDictionaries: "Editar Diccionarios",
    editDictionariesDesc: "Gestionar alérgenos, dietas e intolerancias",
    manageSynonyms: "Gestionar Sinónimos",
    manageSynonymsDesc: "Agregar nombres alternativos para mejores coincidencias",
    systemSettings: "Configuración del Sistema",
    systemSettingsDesc: "Configurar banderas de funcionalidad y comportamiento de la app",
    viewAuditLog: "Ver Registro de Auditoría",
    viewAuditLogDesc: "Revisar todos los cambios en diccionarios",
  },

  // E-numbers
  eNumbers: {
    title: "Números E",
    description: "Gestionar aditivos alimentarios y sus vínculos con alérgenos",
    addButton: "Agregar Número E",
    searchPlaceholder: "Buscar por código o nombre...",
    emptyMessage: "No se encontraron números E. Crea uno para comenzar.",
    // Table columns
    colCode: "Código",
    colName: "Nombre (ES)",
    colOrigins: "Orígenes",
    colLinkedAllergens: "Alérgenos Vinculados",
    colProteinRisk: "Riesgo Proteico",
    // Messages
    created: "Número E {code} creado exitosamente",
    updated: "Número E {code} actualizado exitosamente",
    deleted: "Número E {code} eliminado exitosamente",
    failedToLoad: "Error al cargar números E",
    failedToSave: "Error al guardar número E",
    failedToDelete: "Error al eliminar número E",
    // Dialog
    dialogCreateTitle: "Crear Número E",
    dialogEditTitle: "Editar {code}",
    dialogCreateDesc: "Agrega un nuevo número E a la base de datos.",
    dialogUpdateDesc: "Actualiza la información del número E a continuación.",
    fieldCode: "Código",
    fieldCodePlaceholder: "ej., E102, E322",
    fieldCodeDesc: "Formato: E seguido de números (ej., E322, E110a)",
    fieldName: "Nombre (Español)",
    fieldNamePlaceholder: "ej., Tartrazina, Lecitina",
    fieldOrigins: "Orígenes Probables",
    fieldOriginsPlaceholder: "ej., soja, girasol, huevo",
    fieldOriginsDesc: "Posibles fuentes de este aditivo",
    fieldAllergenKeys: "Claves de Alérgenos Vinculados",
    fieldAllergenKeysPlaceholder: "ej., soja, huevo, leche",
    fieldAllergenKeysDesc: "Claves de alérgenos que este aditivo puede contener",
    fieldProteinRisk: "Riesgo de Proteína Residual",
    fieldProteinRiskDesc: "¿Este aditivo conlleva riesgo de proteínas residuales de su fuente?",
    fieldNotes: "Notas (Opcional)",
    fieldNotesPlaceholder: "Información adicional sobre este número E...",
  },

  // Dictionaries
  dictionaries: {
    title: "Diccionarios",
    description: "Gestionar alérgenos, dietas e intolerancias utilizados en toda la aplicación",
    tabAllergens: "Alérgenos ({count})",
    tabDiets: "Dietas ({count})",
    tabIntolerances: "Intolerancias ({count})",
    // Allergens
    addAllergen: "Agregar Alérgeno",
    allergenCreated: "Alérgeno \"{name}\" creado exitosamente",
    allergenUpdated: "Alérgeno \"{name}\" actualizado exitosamente",
    allergenDeleted: "Alérgeno \"{name}\" eliminado exitosamente",
    allergenFailedLoad: "Error al cargar alérgenos",
    allergenFailedSave: "Error al guardar alérgeno",
    allergenFailedDelete: "Error al eliminar alérgeno",
    allergenEmptyMessage: "No se encontraron alérgenos. Agrega tu primer alérgeno para comenzar.",
    allergenSearchPlaceholder: "Buscar alérgenos por clave o nombre...",
    // Diets
    addDiet: "Agregar Dieta",
    dietCreated: "Dieta \"{name}\" creada exitosamente",
    dietUpdated: "Dieta \"{name}\" actualizada exitosamente",
    dietDeleted: "Dieta \"{name}\" eliminada exitosamente",
    dietFailedLoad: "Error al cargar dietas",
    dietFailedSave: "Error al guardar dieta",
    dietFailedDelete: "Error al eliminar dieta",
    dietEmptyMessage: "No se encontraron dietas. Agrega tu primera dieta para comenzar.",
    dietSearchPlaceholder: "Buscar dietas por clave o nombre...",
    // Intolerances
    addIntolerance: "Agregar Intolerancia",
    intoleranceCreated: "Intolerancia \"{name}\" creada exitosamente",
    intoleranceUpdated: "Intolerancia \"{name}\" actualizada exitosamente",
    intoleranceDeleted: "Intolerancia \"{name}\" eliminada exitosamente",
    intoleranceFailedLoad: "Error al cargar intolerancias",
    intoleranceFailedSave: "Error al guardar intolerancia",
    intoleranceFailedDelete: "Error al eliminar intolerancia",
    intoleranceEmptyMessage: "No se encontraron intolerancias. Agrega tu primera intolerancia para comenzar.",
    intoleranceSearchPlaceholder: "Buscar intolerancias por clave o nombre...",
    // Common fields
    fieldKey: "Clave",
    fieldKeyPlaceholder: "ej., {example}",
    fieldKeyDesc: "Identificador único en minúsculas (no se puede cambiar después de la creación)",
    fieldNameES: "Nombre (Español)",
    fieldNameESPlaceholder: "ej., {example}",
    fieldNameESDesc: "Nombre para mostrar en español (variante chilena)",
    fieldSynonyms: "Sinónimos",
    fieldSynonymsPlaceholder: "ej., {example}",
    fieldSynonymsDesc: "Nombres alternativos para coincidencias (presiona Enter para agregar)",
    fieldSynonymExists: "El sinónimo ya existe",
    fieldNotes: "Notas (opcional)",
    fieldNotesPlaceholder: "Información adicional...",
    fieldNotesDesc: "Notas internas de referencia",
    fieldDescription: "Descripción (opcional)",
    fieldDescriptionPlaceholder: "Breve descripción...",
    fieldDescriptionDesc: "Descripción orientada al usuario",
    // Table
    colKey: "Clave",
    colName: "Nombre",
    colSynonyms: "Sinónimos",
    colNotes: "Notas",
    colDescription: "Descripción",
  },

  // Synonyms
  synonyms: {
    title: "Sinónimos de Alérgenos",
    description: "Gestionar nombres alternativos para coincidencias de alérgenos con búsqueda trigrama",
    addButton: "Agregar Sinónimo",
    searchPlaceholder: "Buscar sinónimos por superficie o alérgeno...",
    filterBy: "Filtrar por alérgeno:",
    allAllergens: "Todos los Alérgenos",
    count: "{count} sinónimos",
    emptyMessage: "No se encontraron sinónimos. Agrega tu primer sinónimo para comenzar.",
    emptyFiltered: "No se encontraron sinónimos para el alérgeno seleccionado.",
    // Messages
    created: "Sinónimo \"{surface}\" creado exitosamente",
    updated: "Sinónimo \"{surface}\" actualizado exitosamente",
    deleted: "Sinónimo \"{surface}\" eliminado exitosamente",
    failedLoad: "Error al cargar sinónimos",
    failedLoadAllergens: "Error al cargar alérgenos",
    failedSave: "Error al guardar sinónimo",
    failedDelete: "Error al eliminar sinónimo",
    // Dialog
    dialogCreateTitle: "Crear Sinónimo",
    dialogEditTitle: "Editar Sinónimo",
    dialogCreateDesc: "Agrega un nuevo sinónimo para coincidencias de alérgenos.",
    dialogUpdateDesc: "Actualiza la información del sinónimo a continuación.",
    fieldAllergen: "Alérgeno",
    fieldAllergenPlaceholder: "Selecciona un alérgeno",
    fieldAllergenDesc: "Selecciona a qué alérgeno pertenece este sinónimo",
    fieldAllergenDescLocked: "No se puede cambiar el alérgeno después de la creación",
    fieldSurface: "Superficie (Texto del Sinónimo)",
    fieldSurfacePlaceholder: "ej., lácteos, productos lácteos",
    fieldSurfaceDesc: "El texto que se comparará con las etiquetas de productos",
    fieldWeight: "Peso (Prioridad de Coincidencia)",
    fieldWeightLow: "1 - Baja prioridad",
    fieldWeightMedium: "2 - Prioridad media",
    fieldWeightHigh: "3 - Alta prioridad",
    fieldWeightDesc: "Mayor peso = más probabilidad de coincidencia. Usa 3 para coincidencias exactas, 1 para parciales/difusas.",
    fieldLocale: "Idioma",
    fieldLocaleCL: "es-CL (Español Chileno)",
    fieldLocaleES: "es-ES (Español de España)",
    fieldLocaleUS: "en-US (Inglés de EE.UU.)",
    fieldLocaleDesc: "Idioma y región para este sinónimo",
    // Table
    colSurface: "Superficie (Sinónimo)",
    colAllergen: "Alérgeno",
    colLocale: "Idioma",
    colWeight: "Peso",
  },

  // Settings
  settings: {
    title: "Configuración de la Aplicación",
    description: "Configurar ajustes globales y alternadores de la aplicación",
    searchPlaceholder: "Buscar configuraciones por clave o descripción...",
    emptyMessage: "No se encontraron configuraciones.",
    count: "{count} configuraciones",
    lastUpdated: "Última actualización: {date}",
    never: "Nunca",
    // Messages
    updated: "Configuración \"{key}\" actualizada exitosamente",
    failedLoad: "Error al cargar configuraciones",
    failedSave: "Error al actualizar configuración",
    // Dialog
    dialogTitle: "Editar Configuración: {key}",
    dialogDesc: "Actualiza el valor y descripción de esta configuración de aplicación.",
    fieldValue: "Valor",
    fieldValueEnabled: "Habilitado",
    fieldValueDisabled: "Deshabilitado",
    fieldValueToggleDesc: "Activar o desactivar esta configuración",
    fieldValueTypeBoolean: "Valor booleano (verdadero/falso)",
    fieldValueTypeNumber: "Valor numérico",
    fieldValueTypeString: "Valor de texto",
    fieldValueTypeJSON: "Valor JSON",
    fieldDescription: "Descripción (opcional)",
    fieldDescriptionPlaceholder: "Describe qué controla esta configuración...",
    fieldDescriptionDesc: "Documentación interna para esta configuración",
    invalidJSON: "Formato JSON inválido",
    // Table
    colKey: "Clave",
    colType: "Tipo",
    colValue: "Valor",
    colDescription: "Descripción",
    colUpdatedAt: "Actualizado El",
    // Types
    typeBoolean: "Booleano",
    typeNumber: "Número",
    typeString: "Texto",
    typeArray: "Arreglo",
    typeObject: "Objeto",
    typeNull: "Nulo",
    typeUnknown: "Desconocido",
    arrayItems: "{count} elementos",
  },

  // Audit Log
  audit: {
    title: "Registro de Auditoría",
    description: "Rastrear todos los cambios realizados en datos de diccionarios con diferencias antes/después",
    searchPlaceholder: "Buscar por tabla, ID de fila o usuario...",
    emptyMessage: "No se encontraron entradas de auditoría.",
    emptyFiltered: "No hay entradas de auditoría que coincidan con los filtros seleccionados.",
    count: "{count} entradas",
    filterTable: "Tabla:",
    filterAction: "Acción:",
    allTables: "Todas las Tablas",
    allActions: "Todas las Acciones",
    // Messages
    failedLoad: "Error al cargar registro de auditoría",
    // Table
    colTable: "Tabla",
    colAction: "Acción",
    colRowId: "ID de Fila",
    colChangedBy: "Modificado Por",
    colChangedAt: "Modificado El",
    // Detail Dialog
    detailTitle: "Detalles de Entrada de Auditoría",
    detailDesc: "Cambios realizados en {table} el {date}",
    detailTable: "Tabla:",
    detailRowId: "ID de Fila:",
    detailChangedBy: "Modificado Por:",
    detailChangedAt: "Modificado El:",
    detailNewData: "Nuevos Datos:",
    detailOldData: "Datos Eliminados:",
    detailNoData: "Sin datos",
    detailChanges: "Cambios ({count} campos modificados):",
    detailNoChanges: "No se detectaron cambios de campos",
    detailModified: "Modificado",
    detailOldValue: "Valor Anterior:",
    detailNewValue: "Valor Nuevo:",
  },

  // Delete Dialogs
  deleteDialog: {
    title: "¿Eliminar {type}?",
    description: "Esta acción no se puede deshacer. Esto eliminará permanentemente {name} ({key}) de la base de datos.",
    warning: "Advertencia: Esto puede afectar perfiles de usuario que referencien este {type}.",
    eNumberWarning: "Advertencia: Este número E está vinculado a {count} alérgeno(s).",
  },

  // Data Table
  dataTable: {
    showingResults: "Mostrando {count} de {total} resultado(s)",
    noResultsFor: "No hay resultados para \"{query}\"",
  },
} as const;

// Helper function to replace placeholders
export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = adminTranslations;

  for (const k of keys) {
    value = value[k];
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string: ${key}`);
    return key;
  }

  if (!params) return value;

  return Object.entries(params).reduce(
    (str, [param, val]) => str.replace(`{${param}}`, String(val)),
    value
  );
}
