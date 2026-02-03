-- Create assistants table
CREATE TABLE public.assistants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
    first_name text NOT NULL,
    last_name text,
    email text NOT NULL,
    phone text,
    is_active boolean DEFAULT true,
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create unique constraint on email per branch
CREATE UNIQUE INDEX assistants_email_branch_idx ON public.assistants(email, branch_id);

-- Create training_sessions table
CREATE TABLE public.training_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
    session_date date NOT NULL,
    term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create unique constraint on session_date per branch
CREATE UNIQUE INDEX training_sessions_date_branch_idx ON public.training_sessions(session_date, branch_id);

-- Create training_session_slots table
CREATE TABLE public.training_session_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    training_session_id uuid REFERENCES public.training_sessions(id) ON DELETE CASCADE NOT NULL,
    time_slot text NOT NULL,
    display_name text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create unique constraint on time_slot per session
CREATE UNIQUE INDEX training_session_slots_time_session_idx ON public.training_session_slots(training_session_id, time_slot);

-- Create branch_time_slots table for configurable defaults
CREATE TABLE public.branch_time_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
    time_slot text NOT NULL,
    display_name text NOT NULL,
    sort_order integer DEFAULT 0,
    is_default boolean DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create unique constraint on time_slot per branch
CREATE UNIQUE INDEX branch_time_slots_time_branch_idx ON public.branch_time_slots(branch_id, time_slot);

-- Create assistant_availability table
CREATE TABLE public.assistant_availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assistant_id uuid REFERENCES public.assistants(id) ON DELETE CASCADE NOT NULL,
    training_session_slot_id uuid REFERENCES public.training_session_slots(id) ON DELETE CASCADE NOT NULL,
    status text DEFAULT 'not_marked' CHECK (status IN ('available', 'unavailable', 'not_marked')),
    notes text,
    marked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create unique constraint on assistant per slot
CREATE UNIQUE INDEX assistant_availability_assistant_slot_idx ON public.assistant_availability(assistant_id, training_session_slot_id);

-- Enable RLS on all tables
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_availability ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
CREATE TRIGGER update_assistants_updated_at
    BEFORE UPDATE ON public.assistants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at
    BEFORE UPDATE ON public.training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assistant_availability_updated_at
    BEFORE UPDATE ON public.assistant_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();