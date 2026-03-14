import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FROM = 'no-reply@vora.sk';

function buildSubject(type: string, taskTitle: string): string {
  switch (type) {
    case 'assigned':  return `Nová úloha: ${taskTitle}`;
    case 'completed': return `Úloha dokončená: ${taskTitle}`;
    case 'comment':   return `Nový komentár k úlohe: ${taskTitle}`;
    default:          return `Aktualizácia úlohy: ${taskTitle}`;
  }
}

function buildHtml(type: string, payload: {
  taskTitle: string;
  taskStatus: string;
  senderName: string;
  recipientName: string;
}): string {
  const { taskTitle, taskStatus, senderName, recipientName } = payload;

  let headline = '';
  let body = '';

  switch (type) {
    case 'assigned':
      headline = 'Bola vám priradená nová úloha';
      body = `<b>${senderName}</b> vám priradil/a úlohu <b>${taskTitle}</b>.`;
      break;
    case 'completed':
      headline = 'Úloha bola dokončená';
      body = `<b>${recipientName}</b> dokončil/a úlohu <b>${taskTitle}</b>, ktorú ste vytvorili.`;
      break;
    case 'comment':
      headline = 'Nový komentár k vašej úlohe';
      body = `Bol pridaný nový komentár k úlohe <b>${taskTitle}</b>.`;
      break;
    default:
      headline = 'Aktualizácia úlohy';
      body = `Úloha <b>${taskTitle}</b> bola aktualizovaná.`;
  }

  return `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
          <!-- header -->
          <tr>
            <td style="background:#0d9488;padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.04em;">VORA</span>
            </td>
          </tr>
          <!-- body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#111827;">${headline}</h1>
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">${body}</p>
              <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;width:100%;">
                <tr>
                  <td style="font-size:13px;color:#6b7280;padding:4px 0;">Názov úlohy</td>
                  <td style="font-size:13px;color:#111827;font-weight:600;padding:4px 0;">${taskTitle}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6b7280;padding:4px 0;">Stav</td>
                  <td style="font-size:13px;color:#111827;padding:4px 0;">${taskStatus}</td>
                </tr>
                ${type === 'assigned' ? `<tr>
                  <td style="font-size:13px;color:#6b7280;padding:4px 0;">Priradil/a</td>
                  <td style="font-size:13px;color:#111827;padding:4px 0;">${senderName}</td>
                </tr>` : ''}
              </table>
            </td>
          </tr>
          <!-- footer -->
          <tr>
            <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Táto správa bola odoslaná automaticky systémom VORA. Neodpovedajte na tento e-mail.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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

  // Fetch task + recipient + sender in parallel
  const [{ data: task }, { data: recipient }, { data: sender }] = await Promise.all([
    supabase.from('tasks').select('id, title, status, deadline, created_by, assigned_to').eq('id', taskId).single(),
    supabase.from('profiles').select('id, name, email').eq('id', recipientId).single(),
    supabase.from('profiles').select('id, name, email').eq('id', senderId).single(),
  ]);

  if (!recipient?.email) {
    return new Response(JSON.stringify({ error: 'Recipient email not found' }), { status: 404, headers: corsHeaders });
  }

  const taskTitle  = task?.title  ?? '—';
  const taskStatus = task?.status ?? '—';
  const senderName = sender?.name ?? sender?.email ?? '—';
  const recipientName = recipient.name ?? recipient.email;

  const subject = buildSubject(type, taskTitle);
  const html    = buildHtml(type, { taskTitle, taskStatus, senderName, recipientName });

  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    console.error('[send-task-notification] RESEND_API_KEY not set');
    return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 500, headers: corsHeaders });
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [recipient.email],
      subject,
      html,
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    console.error('[send-task-notification] Resend error:', resendRes.status, errText);
    return new Response(JSON.stringify({ error: 'Failed to send email', detail: errText }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const resendData = await resendRes.json();
  console.log('[send-task-notification] Email sent:', resendData.id, '→', recipient.email);

  return new Response(JSON.stringify({ ok: true, messageId: resendData.id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
