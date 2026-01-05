-- Update creators table: Set age and dateOfBirth to null in model_profile->personalInfo
UPDATE creators
SET model_profile = jsonb_set(
  jsonb_set(
    model_profile,
    '{personalInfo,age}',
    'null'::jsonb
  ),
  '{personalInfo,dateOfBirth}',
  'null'::jsonb
)
WHERE model_profile IS NOT NULL 
  AND model_profile->'personalInfo' IS NOT NULL;

-- Update onboarding_submissions table: Set age and dateOfBirth to null in data->personalInfo
UPDATE onboarding_submissions
SET data = jsonb_set(
  jsonb_set(
    data,
    '{personalInfo,age}',
    'null'::jsonb
  ),
  '{personalInfo,dateOfBirth}',
  'null'::jsonb
)
WHERE data IS NOT NULL 
  AND data->'personalInfo' IS NOT NULL;