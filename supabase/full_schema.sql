-- =============================================================================
-- GolfGive - Complete Production Supabase Database Schema
-- =============================================================================

-- ─── 1. CUSTOM TYPES & ENUMS ──────────────────────────────────────────────────
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- ─── 2. DATABASE TABLES ────────────────────────────────────────────────────────

-- Profiles table (Linked to auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    role public.user_role NOT NULL DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Golf Scores table
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

-- Subscriptions table
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    plan_type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    renewal_date TIMESTAMP WITH TIME ZONE NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT check_plan_type CHECK (plan_type IN ('monthly', 'yearly')),
    CONSTRAINT check_status CHECK (status IN ('active', 'inactive', 'cancelled', 'expired'))
);

-- Charities table
CREATE TABLE public.charities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    website_url TEXT,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Charities table (Player selections)
CREATE TABLE public.user_charities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    charity_id UUID REFERENCES public.charities(id) ON DELETE CASCADE NOT NULL,
    contribution_percentage INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Contribution check constraint: 10% to 100%
    CONSTRAINT check_contribution_percentage CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100)
);

-- Draws table
CREATE TABLE public.draws (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    draw_month INTEGER NOT NULL CHECK (draw_month >= 1 AND draw_month <= 12),
    draw_year INTEGER NOT NULL CHECK (draw_year >= 2026),
    draw_type TEXT NOT NULL CHECK (draw_type IN ('5 Match', '4 Match', '3 Match')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'simulation', 'published', 'completed')),
    winning_numbers INTEGER[] CHECK (winning_numbers IS NULL OR (array_length(winning_numbers, 1) = 5)),
    jackpot_amount NUMERIC NOT NULL DEFAULT 0 CHECK (jackpot_amount >= 0),
    simulation_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Ensure only one draw structure per month and year
    CONSTRAINT unique_monthly_draw UNIQUE (draw_month, draw_year)
);

-- Draw Entries table
CREATE TABLE public.draw_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    entry_numbers INTEGER[] NOT NULL CHECK (array_length(entry_numbers, 1) = 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Ensure one entry per user per draw
    CONSTRAINT unique_user_draw_entry UNIQUE (draw_id, user_id)
);

-- Winners table
CREATE TABLE public.winners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
    match_type INTEGER NOT NULL CHECK (match_type IN (3, 4, 5)),
    prize_amount NUMERIC NOT NULL CHECK (prize_amount >= 0),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid')),
    proof_url TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    review_notes TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Audit Logs table
CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─── 3. PERFORMANCE INDEXES ───────────────────────────────────────────────────
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_golf_scores_user_id ON public.golf_scores(user_id);
CREATE INDEX idx_golf_scores_score_date ON public.golf_scores(score_date);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_charities_slug ON public.charities(slug);
CREATE INDEX idx_charities_featured ON public.charities(featured);
CREATE INDEX idx_user_charities_user_id ON public.user_charities(user_id);
CREATE INDEX idx_draws_status ON public.draws(status);
CREATE INDEX idx_draw_entries_draw_id ON public.draw_entries(draw_id);
CREATE INDEX idx_draw_entries_user_id ON public.draw_entries(user_id);
CREATE INDEX idx_winners_draw_id ON public.winners(draw_id);
CREATE INDEX idx_winners_user_id ON public.winners(user_id);
CREATE INDEX idx_winners_payment_status ON public.winners(payment_status);
CREATE INDEX idx_winners_verification_status ON public.winners(verification_status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ─── 4. ROW LEVEL SECURITY (RLS) ACTIVATION ────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── 5. ROW LEVEL SECURITY (RLS) POLICIES ──────────────────────────────────────

-- 5.1 Profiles Policies
CREATE POLICY "Allow users to view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admins to view all profiles" ON public.profiles FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "Allow admins to manage all profiles" ON public.profiles FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 5.2 Golf Scores Policies
CREATE POLICY "Allow users to view own scores" ON public.golf_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert own scores" ON public.golf_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update own scores" ON public.golf_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own scores" ON public.golf_scores FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Allow admins to view all scores" ON public.golf_scores FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Allow admins to manage all scores" ON public.golf_scores FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 5.3 Subscriptions Policies
CREATE POLICY "Users can read own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subscription" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 5.4 Charities Policies
CREATE POLICY "Allow public read charities" ON public.charities FOR SELECT USING (true);
CREATE POLICY "Allow admin manage charities" ON public.charities FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 5.5 User Charities Policies
CREATE POLICY "Allow users to view own selection" ON public.user_charities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to manage own selection" ON public.user_charities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow admins to view all selections" ON public.user_charities FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 5.6 Draws Policies
CREATE POLICY "Users can read published or completed draws" ON public.draws FOR SELECT USING (status IN ('published', 'completed'));
CREATE POLICY "Admins can manage all draws" ON public.draws FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 5.7 Draw Entries Policies
CREATE POLICY "Users can view own draw entries" ON public.draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own draw entries" ON public.draw_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all draw entries" ON public.draw_entries FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 5.8 Winners Policies
CREATE POLICY "Users can view own winnings" ON public.winners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own winnings for proof upload" ON public.winners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all winnings" ON public.winners FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 5.9 Notifications Policies
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 5.10 Audit Logs Policies
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- ─── 6. AUTOMATED USER TRIGGER (auth.users -> public.profiles) ─────────────────

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

-- ─── 7. STORAGE BUCKET & STORAGE POLICIES ─────────────────────────────────────

-- Register storage bucket for winner proofs (private bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('winner-proofs', 'winner-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for winner proofs
CREATE POLICY "Users can upload own proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'winner-proofs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view own proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'winner-proofs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Admins can manage all proofs" ON storage.objects
    FOR ALL USING (
        bucket_id = 'winner-proofs' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
