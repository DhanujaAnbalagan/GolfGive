-- Create draws table
CREATE TABLE IF NOT EXISTS public.draws (
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

-- Create draw_entries table
CREATE TABLE IF NOT EXISTS public.draw_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    entry_numbers INTEGER[] NOT NULL CHECK (array_length(entry_numbers, 1) = 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Ensure one entry per user per draw
    CONSTRAINT unique_user_draw_entry UNIQUE (draw_id, user_id)
);

-- Create winners table
CREATE TABLE IF NOT EXISTS public.winners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
    match_type INTEGER NOT NULL CHECK (match_type IN (3, 4, 5)),
    prize_amount NUMERIC NOT NULL CHECK (prize_amount >= 0),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance queries
CREATE INDEX IF NOT EXISTS idx_draws_status ON public.draws(status);
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw_id ON public.draw_entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user_id ON public.draw_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON public.winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON public.winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_payment_status ON public.winners(payment_status);

-- Enable RLS
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Row Level Security (RLS) Policies
-- ----------------------------------------------------

-- Draws Policies
-- Players can view published or completed draws
CREATE POLICY "Users can read published or completed draws" ON public.draws
    FOR SELECT USING (status IN ('published', 'completed'));

-- Admins can manage all draws (all operations)
CREATE POLICY "Admins can manage all draws" ON public.draws
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Draw Entries Policies
-- Players can view their own entries
CREATE POLICY "Users can view own draw entries" ON public.draw_entries
    FOR SELECT USING (auth.uid() = user_id);

-- Players can log/withdraw their own entries
CREATE POLICY "Users can manage own draw entries" ON public.draw_entries
    FOR ALL USING (auth.uid() = user_id);

-- Admins can view and delete all entries
CREATE POLICY "Admins can manage all draw entries" ON public.draw_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Winners Policies
-- Players can read their own winnings
CREATE POLICY "Users can view own winnings" ON public.winners
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all winnings
CREATE POLICY "Admins can manage all winnings" ON public.winners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
