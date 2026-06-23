const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Accept either name — Supabase-Vercel integration may use SUPABASE_SERVICE_ROLE_KEY
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Log instead of throwing so the serverless function can still boot and
  // return a meaningful error response rather than a generic 500 page.
  console.error(
    'FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be set.'
  );
}

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
    : null;

module.exports = supabase;
