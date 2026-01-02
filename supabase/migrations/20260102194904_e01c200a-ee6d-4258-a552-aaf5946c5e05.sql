-- Add model_type column to creator_invitations to distinguish new vs old model forms
ALTER TABLE public.creator_invitations 
ADD COLUMN model_type text NOT NULL DEFAULT 'old' CHECK (model_type IN ('new', 'old'));