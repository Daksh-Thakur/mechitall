-- Remove check constraint on process_type in machining_services to allow custom process types
ALTER TABLE public.machining_services DROP CONSTRAINT IF EXISTS machining_services_process_type_check;
