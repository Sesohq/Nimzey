import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hrzycikekymemyjmeeuv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyenljaWtla3ltZW15am1lZXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDk5MDcsImV4cCI6MjA4NzgyNTkwN30.GJ3xd6iZvxuWhaIzR-mAKU2GvIHyX0kOVW7Xzg7cWF0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
