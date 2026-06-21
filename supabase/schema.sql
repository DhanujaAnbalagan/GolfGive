-- Create custom role enum type
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    role public.user_role NOT NULL DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create golf scores table
CREATE TABLE public.golf_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL,
    score_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Validation: score range must be 1 to 45
    CONSTRAINT check_score_range CHECK (score >= 1 AND score <= 45),
    -- Validation: one score per date per user
    CONSTRAINT unique_user_score_date UNIQUE (user_id, score_date)
);

-- Indexes for optimal query performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_golf_scores_user_id ON public.golf_scores(user_id);
CREATE INDEX idx_golf_scores_score_date ON public.golf_scores(score_date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Row Level Security (RLS) Policies for Profiles
-- ----------------------------------------------------

-- Allow users to view their own profile
CREATE POLICY "Allow users to view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (e.g., full_name, avatar_url)
CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Allow admins to view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Allow admins to manage all profiles
CREATE POLICY "Allow admins to manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- ----------------------------------------------------
-- Row Level Security (RLS) Policies for Golf Scores
-- ----------------------------------------------------

-- Allow users to view their own scores
CREATE POLICY "Allow users to view own scores" ON public.golf_scores
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own scores
CREATE POLICY "Allow users to insert own scores" ON public.golf_scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own scores
CREATE POLICY "Allow users to update own scores" ON public.golf_scores
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own scores
CREATE POLICY "Allow users to delete own scores" ON public.golf_scores
    FOR DELETE USING (auth.uid() = user_id);

-- Allow admins to view all scores
CREATE POLICY "Allow admins to view all scores" ON public.golf_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Allow admins to manage all scores
CREATE POLICY "Allow admins to manage all scores" ON public.golf_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- ----------------------------------------------------
-- Triggers for User Sync from auth.users
-- ----------------------------------------------------

-- Function to handle new user registration and profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new.email,
        COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'user'::public.user_role),
        COALESCE(new.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
