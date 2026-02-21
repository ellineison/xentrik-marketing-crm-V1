
ALTER TABLE public.creators 
ADD COLUMN content_limitations jsonb DEFAULT '{"tits": false, "pussy": false, "face_with_tits": false, "face_with_pussy": false, "wholesome_selfie": false}'::jsonb;
