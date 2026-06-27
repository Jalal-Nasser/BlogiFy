
UPDATE public.posts
SET content = REPLACE(content, 'kejgjwvesmlaorviofyl.supabase.co', 'gwynqitgepkfzzenlfyu.supabase.co')
WHERE content LIKE '%kejgjwvesmlaorviofyl.supabase.co/storage/v1/object/public/media/%';

UPDATE public.posts
SET featured_image_url = REPLACE(featured_image_url, 'kejgjwvesmlaorviofyl.supabase.co', 'gwynqitgepkfzzenlfyu.supabase.co')
WHERE featured_image_url LIKE '%kejgjwvesmlaorviofyl.supabase.co/storage/v1/object/public/media/%';

UPDATE public.media_assets
SET file_url = REPLACE(file_url, 'kejgjwvesmlaorviofyl.supabase.co', 'gwynqitgepkfzzenlfyu.supabase.co')
WHERE file_url LIKE '%kejgjwvesmlaorviofyl.supabase.co/storage/v1/object/public/media/%';
