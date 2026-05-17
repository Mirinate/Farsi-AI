-- Helper RPC function to increment no-show count atomically
CREATE OR REPLACE FUNCTION increment_no_show(caregiver_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE caregivers
  SET no_show_count = no_show_count + 1
  WHERE id = caregiver_id;
$$;
