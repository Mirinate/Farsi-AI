create or replace function increment_minutes_used(p_user_id uuid, p_seconds integer)
returns void language plpgsql security definer as $$
begin
  update profiles set minutes_used = minutes_used + p_seconds where id = p_user_id;
end;
$$;
