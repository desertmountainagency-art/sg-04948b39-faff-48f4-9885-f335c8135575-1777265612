-- Track when a user completes the onboarding wizard.
-- NULL means the user has not completed onboarding yet.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;
