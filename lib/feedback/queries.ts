/**
 * Database queries for user feedback
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type {
  Feedback,
  CreateFeedbackInput,
  UpdateFeedbackInput,
  FeedbackStatus,
  FeedbackType,
} from './types';

type SupabaseClientType = SupabaseClient<Database>;

export interface ListFeedbackFilters {
  status?: FeedbackStatus;
  feedback_type?: FeedbackType;
  user_id?: string;
  limit?: number;
  offset?: number;
}

/**
 * Create new feedback entry
 */
export async function createFeedback(
  supabase: SupabaseClientType,
  userId: string,
  input: CreateFeedbackInput
): Promise<Feedback> {
  const { data, error } = await supabase
    .from('user_feedback')
    .insert({
      user_id: userId,
      extraction_id: input.extraction_id || null,
      feedback_type: input.feedback_type,
      category: input.category || null,
      severity: input.severity || 'medium',
      message: input.message,
      metadata: input.metadata || {},
      screenshot_url: input.screenshot_url || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create feedback: ${error.message}`);
  }

  return data as Feedback;
}

/**
 * List feedback with optional filters (admin only)
 */
export async function listFeedback(
  supabase: SupabaseClientType,
  filters: ListFeedbackFilters = {}
): Promise<Feedback[]> {
  let query = supabase
    .from('user_feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.feedback_type) {
    query = query.eq('feedback_type', filters.feedback_type);
  }

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list feedback: ${error.message}`);
  }

  return data as Feedback[];
}

/**
 * Get single feedback by ID
 */
export async function getFeedback(
  supabase: SupabaseClientType,
  feedbackId: string
): Promise<Feedback | null> {
  const { data, error } = await supabase
    .from('user_feedback')
    .select('*')
    .eq('id', feedbackId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get feedback: ${error.message}`);
  }

  return data as Feedback;
}

/**
 * Update feedback status and admin notes (admin only)
 */
export async function updateFeedbackStatus(
  supabase: SupabaseClientType,
  feedbackId: string,
  input: UpdateFeedbackInput
): Promise<Feedback> {
  const updateData: any = { ...input };

  // If changing to resolved, set resolved_at
  if (input.status === 'resolved' && !input.resolved_at) {
    updateData.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('user_feedback')
    .update(updateData)
    .eq('id', feedbackId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update feedback: ${error.message}`);
  }

  return data as Feedback;
}

/**
 * Get count of pending feedback (for badge in admin nav)
 */
export async function getPendingFeedbackCount(
  supabase: SupabaseClientType
): Promise<number> {
  const { count, error } = await supabase
    .from('user_feedback')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) {
    throw new Error(`Failed to get pending count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Get user's own feedback
 */
export async function getUserFeedback(
  supabase: SupabaseClientType,
  userId: string
): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('user_feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user feedback: ${error.message}`);
  }

  return data as Feedback[];
}
