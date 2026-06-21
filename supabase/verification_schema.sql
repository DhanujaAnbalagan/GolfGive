-- Drop old payment_status check constraint from winners table
ALTER TABLE public.winners DROP CONSTRAINT IF EXISTS winners_payment_status_check;
ALTER TABLE public.winners ADD CONSTRAINT winners_payment_status_check CHECK (payment_status IN ('pending', 'processing', 'paid'));

-- Add verification and review columns to winners table
ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create notifications table for in-app updates
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for optimal lookup performance
CREATE INDEX IF NOT EXISTS idx_winners_verification_status ON public.winners(verification_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Add UPDATE policy on winners for users to upload proof URL
CREATE POLICY "Users can update own winnings for proof upload" ON public.winners
    FOR UPDATE USING (auth.uid() = user_id);

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
