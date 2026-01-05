-- Copy age and dateOfBirth to modelAge and modelBirthday for onboarding_submissions
UPDATE onboarding_submissions
SET data = jsonb_set(
  jsonb_set(
    data,
    '{personalInfo,modelAge}',
    COALESCE(data->'personalInfo'->'age', 'null')
  ),
  '{personalInfo,modelBirthday}',
  COALESCE(data->'personalInfo'->'dateOfBirth', '""')
)
WHERE data->'personalInfo' IS NOT NULL
  AND (
    data->'personalInfo'->'modelAge' IS NULL 
    OR data->'personalInfo'->'modelBirthday' IS NULL 
    OR data->'personalInfo'->>'modelBirthday' = ''
  );

-- Copy age and dateOfBirth to modelAge and modelBirthday for creators
UPDATE creators
SET model_profile = jsonb_set(
  jsonb_set(
    model_profile,
    '{personalInfo,modelAge}',
    COALESCE(model_profile->'personalInfo'->'age', 'null')
  ),
  '{personalInfo,modelBirthday}',
  COALESCE(model_profile->'personalInfo'->'dateOfBirth', '""')
)
WHERE model_profile->'personalInfo' IS NOT NULL
  AND (
    model_profile->'personalInfo'->'modelAge' IS NULL 
    OR model_profile->'personalInfo'->'modelBirthday' IS NULL 
    OR model_profile->'personalInfo'->>'modelBirthday' = ''
  );