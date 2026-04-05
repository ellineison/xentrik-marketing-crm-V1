-- Clean up ghost auth record for zre505@gmail.com
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'zre505@gmail.com');
DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'zre505@gmail.com');
DELETE FROM auth.mfa_factors WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'zre505@gmail.com');
DELETE FROM auth.users WHERE email = 'zre505@gmail.com';