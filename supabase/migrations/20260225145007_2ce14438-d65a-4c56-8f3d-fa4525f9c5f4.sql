-- Delete profiles first
DELETE FROM public.profiles WHERE id IN ('ded1efe3-0d68-485b-a632-ee9ee629069f', '5d3ddb65-1ef1-45eb-94b7-b4ed5fb40c04');

-- Delete from auth.identities (required before deleting auth.users)
DELETE FROM auth.identities WHERE user_id IN ('ded1efe3-0d68-485b-a632-ee9ee629069f', '5d3ddb65-1ef1-45eb-94b7-b4ed5fb40c04');

-- Delete from auth.sessions
DELETE FROM auth.sessions WHERE user_id IN ('ded1efe3-0d68-485b-a632-ee9ee629069f', '5d3ddb65-1ef1-45eb-94b7-b4ed5fb40c04');

-- Delete from auth.refresh_tokens  
DELETE FROM auth.refresh_tokens WHERE session_id IN (
  SELECT id FROM auth.sessions WHERE user_id IN ('ded1efe3-0d68-485b-a632-ee9ee629069f', '5d3ddb65-1ef1-45eb-94b7-b4ed5fb40c04')
);

-- Delete from auth.mfa_factors
DELETE FROM auth.mfa_factors WHERE user_id IN ('ded1efe3-0d68-485b-a632-ee9ee629069f', '5d3ddb65-1ef1-45eb-94b7-b4ed5fb40c04');

-- Finally delete the auth users
DELETE FROM auth.users WHERE id IN ('ded1efe3-0d68-485b-a632-ee9ee629069f', '5d3ddb65-1ef1-45eb-94b7-b4ed5fb40c04');