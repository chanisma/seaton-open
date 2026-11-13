-- ================================================================
-- Diagnostic Function: Get Current User Info
-- Purpose: Debug RLS policy issues by checking auth.uid() and profiles
-- ================================================================

CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'profile_exists', EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid()
    ),
    'profile_data', (
      SELECT json_build_object(
        'id', id,
        'email', email,
        'role', role,
        'name', name,
        'last_login', last_login
      )
      FROM profiles
      WHERE id = auth.uid()
    ),
    'can_update_check', EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_info() TO authenticated;

COMMENT ON FUNCTION get_current_user_info() IS 'Diagnostic function to check current user auth and profile status for RLS debugging';
