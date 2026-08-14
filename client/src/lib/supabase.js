import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Keeping client creation here ensures no component needs to know about env configuration.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
