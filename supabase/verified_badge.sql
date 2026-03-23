-- VERIFIED BADGE & SUBSCRIPTION SYSTEM

-- Add verified and plan columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS show_verified_badge BOOLEAN DEFAULT true;

-- Create a table for subscription plans (optional but good for scaling)
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_id TEXT NOT NULL, -- Stripe Price ID
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd'
);

-- Insert the initial premium plan
INSERT INTO public.plans (id, name, price_id, amount)
VALUES ('premium', 'Verified Neural Link', 'price_verified_neural_link', 999)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are viewable by everyone." ON public.plans FOR SELECT USING (true);

-- Update RLS for profiles to ensure plan info is handled correctly
-- (Existing policies already allow public view and owner update)
