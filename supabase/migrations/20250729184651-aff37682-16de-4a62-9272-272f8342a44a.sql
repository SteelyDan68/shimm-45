-- Remove all existing mock/test data from client_data_cache
DELETE FROM client_data_cache WHERE source = 'mock_generator' OR data_type LIKE '%mock%';

-- Also remove any cache data that might contain mock social data
DELETE FROM client_data_cache WHERE data_type = 'social_metrics' AND (data->>'followers')::int < 200000;