import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { withSpan } from '@/lib/otel/withSpan';
import {
  createFeedback,
  listFeedback,
  type ListFeedbackFilters,
} from '@/lib/feedback/queries';
import type { CreateFeedbackInput } from '@/lib/feedback/types';

/**
 * POST /api/feedback - Create new feedback
 */
export async function POST(request: Request) {
  return withSpan('POST /api/feedback', {}, async () => {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const body: CreateFeedbackInput = await request.json();

      // Validate required fields
      if (!body.feedback_type || !body.message) {
        return NextResponse.json(
          { error: 'feedback_type and message are required' },
          { status: 400 }
        );
      }

      // Enrich metadata with request info
      const metadata = {
        ...body.metadata,
        user_agent: request.headers.get('user-agent') || undefined,
        referrer: request.headers.get('referer') || undefined,
      };

      const feedback = await createFeedback(supabase, user.id, {
        ...body,
        metadata,
      });

      return NextResponse.json(
        {
          success: true,
          feedback_id: feedback.id,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Error creating feedback:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create feedback' },
        { status: 500 }
      );
    }
  });
}

/**
 * GET /api/feedback - List feedback (admin only)
 */
export async function GET(request: Request) {
  return withSpan('GET /api/feedback', {}, async () => {
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
      const { searchParams } = new URL(request.url);

      const filters: ListFeedbackFilters = {
        status: searchParams.get('status') as any,
        feedback_type: searchParams.get('type') as any,
        limit: searchParams.get('limit')
          ? parseInt(searchParams.get('limit')!)
          : 100,
        offset: searchParams.get('offset')
          ? parseInt(searchParams.get('offset')!)
          : 0,
      };

      const feedbackList = await listFeedback(supabase, filters);

      return NextResponse.json({
        success: true,
        data: feedbackList,
        count: feedbackList.length,
      });
    } catch (error: any) {
      console.error('Error listing feedback:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to list feedback' },
        { status: 500 }
      );
    }
  });
}
