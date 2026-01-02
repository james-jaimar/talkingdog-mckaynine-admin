-- Step 1: Create app_role enum
CREATE TYPE public.app_role AS ENUM ('platform_admin', 'admin', 'trainer', 'handler', 'user');

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 4: RLS policies for user_roles
CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Platform admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Step 5: Create handler_onboarding table
CREATE TABLE public.handler_onboarding (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on handler_onboarding
ALTER TABLE public.handler_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS policies for handler_onboarding
CREATE POLICY "Users can read their own onboarding status"
ON public.handler_onboarding
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding status"
ON public.handler_onboarding
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all onboarding records"
ON public.handler_onboarding
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'platform_admin') OR public.has_role(auth.uid(), 'trainer'));

CREATE POLICY "Staff can update all onboarding records"
ON public.handler_onboarding
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'platform_admin'));

-- Step 6: Add auth_user_id and onboarding_status to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'pending';

-- Step 7: Create the handler signup trigger function
CREATE OR REPLACE FUNCTION public.handle_handler_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_full_name text;
  v_signup_intent text;
  v_client_id uuid;
  v_branch_id uuid;
BEGIN
  -- Get signup intent from metadata
  v_signup_intent := COALESCE(new.raw_user_meta_data->>'signup_intent', '');
  
  -- Only proceed for handler signups
  IF v_signup_intent != 'handler' THEN
    RETURN new;
  END IF;
  
  -- Parse name from metadata
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', '');
  v_first_name := COALESCE(split_part(v_full_name, ' ', 1), '');
  v_last_name := COALESCE(nullif(trim(substring(v_full_name from position(' ' in v_full_name))), ''), '');
  
  -- Get default branch (first active branch)
  SELECT id INTO v_branch_id FROM public.branches WHERE is_active = true LIMIT 1;
  
  -- Insert role for handler
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'handler')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create stub client record
  INSERT INTO public.clients (
    first_name,
    last_name,
    email,
    auth_user_id,
    onboarding_status,
    branch_id
  )
  VALUES (
    COALESCE(NULLIF(v_first_name, ''), 'New'),
    COALESCE(NULLIF(v_last_name, ''), 'Handler'),
    new.email,
    new.id,
    'pending',
    v_branch_id
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = new.id,
    onboarding_status = COALESCE(clients.onboarding_status, 'pending')
  RETURNING id INTO v_client_id;
  
  -- Create handler_onboarding record
  INSERT INTO public.handler_onboarding (user_id, client_id, status)
  VALUES (new.id, v_client_id, 'pending')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block signup
    RAISE WARNING 'Error in handle_handler_signup: %', SQLERRM;
    RETURN new;
END;
$$;

-- Step 8: Create trigger on auth.users for handler signups
CREATE TRIGGER on_handler_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_handler_signup();

-- Step 9: Migrate existing handler roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'handler'::app_role
FROM public.profiles
WHERE role = 'handler' AND app_id = 'mckaynine-training'
ON CONFLICT (user_id, role) DO NOTHING;

-- Migrate existing admin roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
WHERE role = 'admin' AND app_id = 'mckaynine-training'
ON CONFLICT (user_id, role) DO NOTHING;

-- Migrate existing platform_admin roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'platform_admin'::app_role
FROM public.profiles
WHERE role = 'platform_admin' AND app_id = 'mckaynine-training'
ON CONFLICT (user_id, role) DO NOTHING;

-- Migrate existing trainer roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'trainer'::app_role
FROM public.profiles
WHERE role = 'trainer' AND app_id = 'mckaynine-training'
ON CONFLICT (user_id, role) DO NOTHING;