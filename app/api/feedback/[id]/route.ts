import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { withSpan } from '@/lib/otel/withSpan';
import { updateFeedbackStatus } from '@/lib/feedback/queries';
import type { UpdateFeedbackInput } from '@/lib/feedback/types';

/**
 * PATCH /api/feedback/[id] - Update feedback status (admin only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSpan('PATCH /api/feedback/[id]', {}, async () => {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role_key')
      .eq('user_id', user.id)
      .single();

    if (!userRole || !['owner', 'moderator'].includes(userRole.role_key)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const body: UpdateFeedbackInput = await request.json();
      const { id: feedbackId } = await params;

      // If changing to resolved, set resolved_by
      if (body.status === 'resolved') {
        body.resolved_by = user.id;
      }

      const updatedFeedback = await updateFeedbackStatus(
        supabase,
        feedbackId,
        body
      );

      return NextResponse.json({
        success: true,
        feedback: updatedFeedback,
      });
    } catch (error: any) {
      console.error('Error updating feedback:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update feedback' },
        { status: 500 }
      );
    }
  });
}
