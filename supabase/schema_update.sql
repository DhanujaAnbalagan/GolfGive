-- Create charities table
CREATE TABLE IF NOT EXISTS public.charities (
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

-- Create user_charities table
CREATE TABLE IF NOT EXISTS public.user_charities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    charity_id UUID REFERENCES public.charities(id) ON DELETE CASCADE NOT NULL,
    contribution_percentage INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Contribution check constraint: 10% to 100%
    CONSTRAINT check_contribution_percentage CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100)
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_charities_slug ON public.charities(slug);
CREATE INDEX IF NOT EXISTS idx_charities_featured ON public.charities(featured);
CREATE INDEX IF NOT EXISTS idx_user_charities_user_id ON public.user_charities(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_charities ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Row Level Security (RLS) Policies for Charities
-- ----------------------------------------------------

-- Allow public read access to charities
CREATE POLICY "Allow public read charities" ON public.charities
    FOR SELECT USING (true);

-- Allow admins to manage charities (Insert, Update, Delete)
CREATE POLICY "Allow admin manage charities" ON public.charities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- ----------------------------------------------------
-- Row Level Security (RLS) Policies for User Charities
-- ----------------------------------------------------

-- Allow players to view their own charity selection
CREATE POLICY "Allow users to view own selection" ON public.user_charities
    FOR SELECT USING (auth.uid() = user_id);

-- Allow players to manage their own charity selection
CREATE POLICY "Allow users to manage own selection" ON public.user_charities
    FOR ALL USING (auth.uid() = user_id);

-- Allow admins to view all selections
CREATE POLICY "Allow admins to view all selections" ON public.user_charities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
