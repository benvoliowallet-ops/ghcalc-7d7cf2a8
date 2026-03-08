import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, password } = await req.json();

    if (!projectId || !password) {
      return new Response(JSON.stringify({ error: 'Missing projectId or password' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get portal record
    const { data: portal, error: portalErr } = await supabase
      .from('project_portals')
      .select('plain_password, expires_at, project_id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (portalErr || !portal) {
      return new Response(JSON.stringify({ valid: false, error: 'Portal not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check expiry
    if (portal.expires_at && new Date(portal.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: 'Portal has expired' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check password (constant-time comparison)
    const valid = portal.plain_password === password.trim();

    if (!valid) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch project snapshot (using service role to bypass RLS)
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('id, quote_number, customer_name, project_address, country, snapshot, current_step, num_zones, saved_at')
      .eq('id', projectId)
      .maybeSingle();

    if (projErr || !project) {
      return new Response(JSON.stringify({ valid: false, error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ valid: true, project }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
