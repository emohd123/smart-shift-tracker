-- Purge requested tables while keeping profiles and credits untouched
BEGIN;

-- Delete dependent/child data first (where applicable)
DELETE FROM public.job_applications;
DELETE FROM public.shift_assignments;
DELETE FROM public.time_logs;
DELETE FROM public.notifications;
DELETE FROM public.messages;
DELETE FROM public.documents;
DELETE FROM public.payouts;

-- Delete related domain tables
DELETE FROM public.certificates;
DELETE FROM public.job_postings;
DELETE FROM public.shifts;

COMMIT;