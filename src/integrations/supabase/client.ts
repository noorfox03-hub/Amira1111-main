import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gqwwiprvbyrgwlenprkc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd3dpcHJ2YnlyZ3dsZW5wcmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMDczMjksImV4cCI6MjA4Nzg4MzMyOX0.KmVJJ_c2Aax2H9V3lSCAcJY7tk0uJn9yggLYJm1lsr0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
