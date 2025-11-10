/**
 * Feedback types and enums for user feedback system
 */

export type FeedbackType = 'error_report' | 'suggestion' | 'bug' | 'feature' | 'other';

export type FeedbackCategory =
  | 'wrong_allergen'
  | 'wrong_verdict'
  | 'missing_ingredient'
  | 'ui_issue'
  | 'performance'
  | 'other';

export type FeedbackSeverity = 'low' | 'medium' | 'high' | 'critical';

export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved' | 'closed';

export interface Feedback {
  id: string;
  user_id: string;
  extraction_id: string | null;
  feedback_type: FeedbackType;
  category: FeedbackCategory | null;
  severity: FeedbackSeverity;
  message: string;
  metadata: Record<string, any>;
  screenshot_url: string | null;
  status: FeedbackStatus;
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackInput {
  extraction_id?: string;
  feedback_type: FeedbackType;
  category?: FeedbackCategory;
  severity?: FeedbackSeverity;
  message: string;
  metadata?: Record<string, any>;
  screenshot_url?: string;
}

export interface UpdateFeedbackInput {
  status?: FeedbackStatus;
  admin_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface FeedbackWithUser extends Feedback {
  user_email?: string;
}

// Constants for UI
export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  error_report: 'Reporte de Error',
  suggestion: 'Sugerencia',
  bug: 'Bug',
  feature: 'Nueva Funcionalidad',
  other: 'Otro',
};

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  wrong_allergen: 'Alérgeno Incorrecto',
  wrong_verdict: 'Veredicto Incorrecto',
  missing_ingredient: 'Ingrediente Faltante',
  ui_issue: 'Problema de Interfaz',
  performance: 'Rendimiento',
  other: 'Otro',
};

export const FEEDBACK_SEVERITY_LABELS: Record<FeedbackSeverity, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};
