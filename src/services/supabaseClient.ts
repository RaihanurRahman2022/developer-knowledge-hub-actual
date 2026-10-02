import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://vwnrojjklwrtouawndlt.supabase.co';
const supabaseKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_OV5du1V9qTrfzSWyCG9-SA_LYdtk0QJ';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const SUPABASE_SETUP_SQL = `-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/vwnrojjklwrtouawndlt/sql)

-- 1. Create Knowledge Hub table
CREATE TABLE IF NOT EXISTS public.knowledge_hub_store (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.knowledge_hub_store ENABLE ROW LEVEL SECURITY;

-- 3. Allow anonymous public read/write for personal knowledge base
CREATE POLICY "Public Read Access"
  ON public.knowledge_hub_store
  FOR SELECT
  USING (true);

CREATE POLICY "Public Write Access"
  ON public.knowledge_hub_store
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public Update Access"
  ON public.knowledge_hub_store
  FOR UPDATE
  USING (true);
`;
