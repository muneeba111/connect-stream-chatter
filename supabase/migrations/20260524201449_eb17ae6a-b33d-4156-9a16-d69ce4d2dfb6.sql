
revoke execute on function public.get_or_create_conversation(uuid) from public, anon;
grant execute on function public.get_or_create_conversation(uuid) to authenticated;

revoke execute on function public.touch_conversation_on_dm() from public, anon, authenticated;
