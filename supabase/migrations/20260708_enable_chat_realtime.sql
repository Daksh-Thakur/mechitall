-- Enable Realtime for chat messages
begin;
  alter publication supabase_realtime add table chat_messages;
commit;
