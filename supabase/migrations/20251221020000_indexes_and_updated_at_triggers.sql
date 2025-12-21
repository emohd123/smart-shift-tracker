-- Post-bootstrap indexes & updated_at triggers
-- This migration is intended to run AFTER all base tables/columns exist.

-- Performance indexes (safe/idempotent)
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_reference_number ON public.certificates(reference_number);

CREATE INDEX IF NOT EXISTS idx_shifts_date ON public.shifts(date);

CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON public.time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_shift_id ON public.time_logs(shift_id);

-- Messages uses recipient_id (not receiver_id)
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON public.messages(sender_id, recipient_id);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- updated_at triggers (re-create safely)
-- (Postgres has no CREATE TRIGGER IF NOT EXISTS, so drop then create.)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payouts_updated_at ON public.payouts;
CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


