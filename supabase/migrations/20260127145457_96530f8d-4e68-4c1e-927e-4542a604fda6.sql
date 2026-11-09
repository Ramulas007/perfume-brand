-- Add foreign key from reviews to profiles for the join
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey_profiles 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;