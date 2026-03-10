import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  const senderId = data.claims.sub;

  let body: { type: string; taskId: string; recipientId: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400, headers: corsHeaders });
  }

  const { type, taskId, recipientId } = body;
  if (!type || !taskId || !recipientId) {
    return new Response(JSON.stringify({ error: 'Missing required fields: type, taskId, recipientId' }), { status: 400, headers: corsHeaders });
  }

  // Fetch task + recipient for context
  const [{ data: task }, { data: recipient }] = await Promise.all([
    supabase.from('tasks').select('id, title, status, deadline, created_by, assigned_to').eq('id', taskId).single(),
    supabase.from('profiles').select('id, name, email').eq('id', recipientId).single(),
  ]);

  const payload = {
    type,
    taskId,
    taskTitle: task?.title ?? '—',
    taskStatus: task?.status ?? '—',
    recipientId,
    recipientName: recipient?.name ?? '—',
    recipientEmail: recipient?.email ?? '—',
    senderId,
    timestamp: new Date().toISOString(),
  };

  // TODO: Replace console.log with Resend email sending when email sending is added
  console.log('[send-task-notification]', JSON.stringify(payload, null, 2));

  return new Response(JSON.stringify({ ok: true, payload }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
