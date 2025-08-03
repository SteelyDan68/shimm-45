-- Create RLS policies for messages table (only the missing ones)

-- Users can insert messages they send
CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Users can view messages they sent or received
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can update messages they received (for marking as read)
CREATE POLICY "Users can mark received messages as read" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- Admins can manage all messages
CREATE POLICY "Admins can manage all messages" 
ON public.messages 
FOR ALL 
USING (is_admin(auth.uid()));