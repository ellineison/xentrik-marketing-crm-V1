-- Delete the old accepted onboarding submission for Mollymurph92@gmail.com
DELETE FROM onboarding_submissions 
WHERE email = 'Mollymurph92@gmail.com' 
AND status = 'accepted';