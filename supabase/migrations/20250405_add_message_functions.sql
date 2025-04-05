
-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_client_id UUID, p_message_ids UUID[])
RETURNS void AS $$
BEGIN
  -- Update client_messages to mark them as read
  UPDATE public.client_messages
  SET is_read = true
  WHERE client_id = p_client_id
    AND id = ANY(p_message_ids)
    AND is_from_client = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_client_id UUID)
RETURNS integer AS $$
DECLARE
  count_result integer;
BEGIN
  SELECT COUNT(*)
  INTO count_result
  FROM public.client_messages
  WHERE client_id = p_client_id
    AND is_from_client = false
    AND (is_read IS NULL OR is_read = false);
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
