// Supabase Configuration
// Replace these with your actual Supabase project credentials
// Get them from: https://app.supabase.com/project/_/settings/api

const SUPABASE_URL = 'https://nqrivfrbpchxykhidodj.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_qbwZ93MUmw-mLlAfc8QjJg_dRrzwgPb'

// Initialize Supabase client (loaded via CDN in index.html)
let supabase = null;

// Initialized after DOM loads
function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        ErrorLogger.error('Supabase SDK not loaded. Make sure to include the CDN script in index.html');
        return false;
    }

    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        ErrorLogger.warn('Supabase credentials not configured');
        return false;
    }

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    ErrorLogger.success('Supabase initialized successfully');
    return true;
}
// Variables 'supabase' and 'initSupabase' are now global.
