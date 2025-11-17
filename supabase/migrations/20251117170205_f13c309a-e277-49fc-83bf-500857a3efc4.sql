-- Clean up leftover Zoey records
DELETE FROM sales_tracker WHERE model_name = 'Zoey';
DELETE FROM attendance WHERE model_name = 'Zoey';
DELETE FROM customs WHERE model_name = 'Zoey';
DELETE FROM voice_sources WHERE model_name = 'Zoey';