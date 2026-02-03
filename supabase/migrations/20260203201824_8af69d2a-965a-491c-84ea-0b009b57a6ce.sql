-- RLS Policies for assistants table
CREATE POLICY "Admins have full access to assistants"
ON public.assistants
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistants can read all assistants in their branch"
ON public.assistants
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'assistant') AND
    branch_id IN (
        SELECT a.branch_id FROM public.assistants a WHERE a.user_id = auth.uid()
    )
);

-- RLS Policies for training_sessions table
CREATE POLICY "Admins have full access to training_sessions"
ON public.training_sessions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistants can read training_sessions in their branch"
ON public.training_sessions
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'assistant') AND
    branch_id IN (
        SELECT a.branch_id FROM public.assistants a WHERE a.user_id = auth.uid()
    )
);

-- RLS Policies for training_session_slots table
CREATE POLICY "Admins have full access to training_session_slots"
ON public.training_session_slots
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistants can read training_session_slots in their branch"
ON public.training_session_slots
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'assistant') AND
    training_session_id IN (
        SELECT ts.id FROM public.training_sessions ts
        WHERE ts.branch_id IN (
            SELECT a.branch_id FROM public.assistants a WHERE a.user_id = auth.uid()
        )
    )
);

-- RLS Policies for branch_time_slots table
CREATE POLICY "Admins have full access to branch_time_slots"
ON public.branch_time_slots
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for assistant_availability table
CREATE POLICY "Admins have full access to assistant_availability"
ON public.assistant_availability
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistants can read all availability in their branch"
ON public.assistant_availability
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'assistant') AND
    assistant_id IN (
        SELECT a.id FROM public.assistants a
        WHERE a.branch_id IN (
            SELECT a2.branch_id FROM public.assistants a2 WHERE a2.user_id = auth.uid()
        )
    )
);

CREATE POLICY "Assistants can update their own availability"
ON public.assistant_availability
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'assistant') AND
    assistant_id IN (
        SELECT a.id FROM public.assistants a WHERE a.user_id = auth.uid()
    )
)
WITH CHECK (
    public.has_role(auth.uid(), 'assistant') AND
    assistant_id IN (
        SELECT a.id FROM public.assistants a WHERE a.user_id = auth.uid()
    )
);

CREATE POLICY "Assistants can insert their own availability"
ON public.assistant_availability
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'assistant') AND
    assistant_id IN (
        SELECT a.id FROM public.assistants a WHERE a.user_id = auth.uid()
    )
);