-- Create user_feedback table for collecting user feedback and error reports
CREATE TABLE user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  extraction_id uuid REFERENCES extractions(id) ON DELETE SET NULL,

  -- Feedback classification
  feedback_type text NOT NULL CHECK (feedback_type IN ('error_report', 'suggestion', 'bug', 'feature', 'other')),
  category text CHECK (category IN ('wrong_allergen', 'wrong_verdict', 'missing_ingredient', 'ui_issue', 'performance', 'other')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Content
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  screenshot_url text,

  -- Admin workflow
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'closed')),
  admin_notes text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_extraction_id ON user_feedback(extraction_id) WHERE extraction_id IS NOT NULL;
CREATE INDEX idx_user_feedback_status ON user_feedback(status);
CREATE INDEX idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX idx_user_feedback_created_at ON user_feedback(created_at DESC);

-- Composite index for admin filtering
CREATE INDEX idx_user_feedback_status_created ON user_feedback(status, created_at DESC);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_user_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_feedback_updated_at
  BEFORE UPDATE ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_user_feedback_updated_at();

-- RLS Policies
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can create their own feedback
CREATE POLICY "Users can create their own feedback"
  ON user_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON user_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON user_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'moderator')
    )
  );

-- Admins can update feedback (status, notes, etc.)
CREATE POLICY "Admins can update feedback"
  ON user_feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'moderator')
    )
  );

-- Comment on table
COMMENT ON TABLE user_feedback IS 'User feedback, bug reports, and feature requests';
COMMENT ON COLUMN user_feedback.metadata IS 'Additional context: URL, user agent, viewport, etc.';
COMMENT ON COLUMN user_feedback.severity IS 'Impact level: low (cosmetic) to critical (blocking)';
