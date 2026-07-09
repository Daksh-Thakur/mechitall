-- 1. Add rfq_id column to machining_quotes
ALTER TABLE public.machining_quotes ADD COLUMN IF NOT EXISTS rfq_id uuid REFERENCES public.rfqs(id) ON DELETE CASCADE;

-- 2. Backfill existing records
UPDATE public.machining_quotes mq
SET rfq_id = (
  SELECT rfq.id 
  FROM public.rfqs rfq
  WHERE rfq.buyer_id = mq.buyer_profile_id 
    AND rfq.cad_file_path = mq.cad_file_name
  ORDER BY rfq.created_at DESC
  LIMIT 1
)
WHERE mq.rfq_id IS NULL;
