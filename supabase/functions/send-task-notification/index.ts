import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROM = 'no-reply@ghcalc.vora.sk';

// ─── Types ────────────────────────────────────────────────────────────────────
type NotifType  = 'assigned' | 'completed' | 'comment';
type Priority   = 'urgent' | 'high' | 'medium' | 'low';
type TaskStatus = 'todo' | 'in_progress' | 'done';

interface HtmlPayload {
  taskTitle:       string;
  taskStatus:      TaskStatus;
  taskPriority:    Priority;
  taskDeadline:    string | null;
  taskDescription: string | null;
  senderName:      string;
  recipientName:   string;
  projectRef:      string;
  projectName:     string;
  commentText?:    string | null;
  commentAuthor?:  string | null;
  commentAt?:      string | null;
}

// ─── Logos (base64 PNG) ───────────────────────────────────────────────────────
const SANFOG_PIKT_B64 = "data:image/png;base64,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";
const VORA_B64        = "data:image/png;base64,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";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const F = 'font-family:Arial,sans-serif;';

function buildSubject(type: NotifType, taskTitle: string, senderName?: string): string {
  const map: Record<NotifType, string> = {
    assigned:  'Nová úloha: '                    + taskTitle,
    completed: (senderName ?? 'Používateľ') + ' dokončil úlohu: ' + taskTitle,
    comment:   'Nový komentár k úlohe: '         + taskTitle,
  };
  return map[type] ?? 'Aktualizácia úlohy: ' + taskTitle;
}

function priorityLabel(p: Priority): string {
  return ({ urgent: 'URGENTNÁ', high: 'VYSOKÁ', medium: 'STREDNÁ', low: 'NÍZKA' } as Record<Priority, string>)[p] ?? 'STREDNÁ';
}
function priorityColor(p: Priority): string {
  return ({ urgent: '#dc2626', high: '#e53935', medium: '#b45309', low: '#0d9488' } as Record<Priority, string>)[p] ?? '#b45309';
}
function statusLabel(s: TaskStatus): string {
  return ({ todo: 'Todo', in_progress: 'V riešení', done: 'Dokončené' } as Record<TaskStatus, string>)[s] ?? 'Todo';
}
function statusColor(s: TaskStatus): string {
  return ({ todo: '#94a3b8', in_progress: '#f59e0b', done: '#1a6b2e' } as Record<TaskStatus, string>)[s] ?? '#94a3b8';
}
function formatDeadline(d: string | null): string {
  if (!d) return '&mdash;';
  const dt = new Date(d);
  const tz = 'Europe/Bratislava';
  const overdue = dt < new Date();
  const fmt = dt.toLocaleDateString('sk-SK', { day: '2-digit', month: 'long', year: 'numeric', timeZone: tz });
  return overdue
    ? '<span style="color:#dc2626;font-weight:600">' + fmt + ' &middot; Oneskorené</span>'
    : fmt;
}
function formatDateTime(d: string | null): string {
  if (!d) return '';
  const dt = new Date(d);
  const tz = 'Europe/Bratislava';
  return dt.toLocaleDateString('sk-SK', { day: '2-digit', month: 'long', year: 'numeric', timeZone: tz }) +
    ', ' + dt.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', timeZone: tz });
}

// ─── Template building blocks ─────────────────────────────────────────────────
function hdr(accentColor: string): string {
  return '<table width="100%" cellpadding="0" cellspacing="0" border="0">' +
    '<tr><td style="background:#002a4c;padding:20px 28px;">' +
      '<table cellpadding="0" cellspacing="0" border="0"><tr>' +
        '<td style="vertical-align:middle;padding-right:18px"><img src="' + SANFOG_PIKT_B64 + '" height="50" width="50" style="display:block"/></td>' +
        '<td style="vertical-align:middle;border-left:1px solid rgba(255,255,255,.2);padding-left:18px">' +
          '<div style="font-size:9px;color:rgba(255,255,255,.5);letter-spacing:2.5px;text-transform:uppercase;' + F + 'margin-bottom:4px">Sanfog s.r.o.</div>' +
          '<div style="font-size:20px;color:#fff;font-weight:700;letter-spacing:1px;' + F + '">GREENHOUSE CALC</div>' +
        '</td>' +
      '</tr></table>' +
    '</td></tr>' +
    '<tr><td style="background:' + accentColor + ';height:4px;font-size:1px">&nbsp;</td></tr>' +
  '</table>';
}

function ftr(): string {
  return '<table width="100%" cellpadding="0" cellspacing="0" border="0">' +
    '<tr><td style="background:#002a4c;padding:16px 28px;text-align:center">' +
      '<img src="' + VORA_B64 + '" height="44" style="display:inline-block;margin-bottom:6px"/>' +
      '<div style="font-size:11px;color:rgba(255,255,255,.45);' + F + '">Automatizované notifikácie &nbsp;·&nbsp; Greenhouse Calc</div>' +
      '<div style="font-size:11px;color:rgba(255,255,255,.25);' + F + 'margin-top:5px">Tento email bol vygenerovaný automaticky. Neodpovedajte naň priamo.</div>' +
    '</td></tr>' +
  '</table>';
}

function btn(label: string, color: string, taskId: string): string {
  const url = 'https://ghcalc.lovable.app/tasks?taskId=' + encodeURIComponent(taskId);
  return '<table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px"><tr><td style="background:' + color + ';border-radius:6px">' +
    '<a href="' + url + '" style="display:inline-block;padding:13px 32px;color:#fff;font-weight:700;font-size:14px;text-decoration:none;' + F + 'letter-spacing:.5px">' + label + ' &rarr;</a>' +
    '</td></tr></table>';
}

function row(label: string, value: string): string {
  return '<tr><td style="padding:5px 0;font-size:13px;color:#999;width:130px;vertical-align:top;' + F + '">' + label + '</td>' +
    '<td style="padding:5px 0;font-size:13px;color:#222;font-weight:600;' + F + '">' + value + '</td></tr>';
}

function badge(label: string, bg: string, color: string): string {
  return '<div style="display:inline-block;background:' + bg + ';color:' + color + ';font-size:10px;font-weight:700;padding:4px 12px;border-radius:4px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;' + F + '">' + label + '</div>';
}

function box(content: string): string {
  return '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f8fa;border-radius:8px;border:1px solid #e8eaed;margin-bottom:8px"><tr><td style="padding:18px 20px">' + content + '</td></tr></table>';
}

function dot(color: string): string {
  return '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + color + ';margin-right:6px;vertical-align:middle"></span>';
}

function bodyWrap(content: string): string {
  return '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:32px 28px 28px">' + content + '</td></tr></table>';
}

function h1(text: string): string {
  return '<h1 style="font-size:22px;color:#002a4c;margin:0 0 10px;font-weight:700;' + F + '">' + text + '</h1>';
}

function para(html: string): string {
  return '<p style="font-size:15px;color:#555;margin:0 0 24px;' + F + 'line-height:1.65">' + html + '</p>';
}

// ─── Main HTML builder ────────────────────────────────────────────────────────
function buildHtml(type: NotifType, payload: HtmlPayload): string {
  const {
    taskTitle, taskStatus, taskPriority, taskDeadline,
    senderName, recipientName, projectRef, projectName,
    commentText, commentAuthor, commentAt,
  } = payload;

  const projLabel = projectRef + (projectName ? ' – ' + projectName : '');

  if (type === 'assigned') {
    const accentColor = '#f38f00';
    return '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8"/><title>Nová úloha</title></head><body style="margin:0;padding:0;background:#e8eaed">' +
      '<div style="max-width:600px;margin:0 auto;background:#fff">' +
      hdr(accentColor) +
      bodyWrap(
        badge('Nová úloha', '#fff5e6', '#b46c00') +
        h1('Bola vám pridelená nová úloha') +
        para('<strong style="color:#002a4c">' + senderName + '</strong> vám pridelil novú úlohu v projekte Greenhouse Calc.') +
        box(
          '<div style="font-size:16px;font-weight:700;color:#002a4c;margin-bottom:14px;' + F + '">' + taskTitle + '</div>' +
          '<table cellpadding="0" cellspacing="0" border="0" width="100%">' +
            row('Projekt:', projLabel || '—') +
            row('Priorita:', dot(priorityColor(taskPriority)) + priorityLabel(taskPriority)) +
            row('Termín:', formatDeadline(taskDeadline)) +
            row('Pridelil/a:', senderName) +
          '</table>'
        ) +
        btn('Zobraziť úlohu', accentColor, task?.id ?? '')
      ) +
      ftr() +
      '</div></body></html>';
  }

  if (type === 'comment') {
    const accentColor = '#00adc6';
    return '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8"/><title>Nový komentár</title></head><body style="margin:0;padding:0;background:#e8eaed">' +
      '<div style="max-width:600px;margin:0 auto;background:#fff">' +
      hdr(accentColor) +
      bodyWrap(
        badge('Nový komentár', '#e4f7fb', '#006e81') +
        h1('Nový komentár k vašej úlohe') +
        para('<strong style="color:#002a4c">' + (commentAuthor ?? senderName) + '</strong> okomentoval úlohu, ku ktorej ste priradený/á.') +
        box(
          '<div style="font-size:11px;color:#aaa;margin-bottom:4px;text-transform:uppercase;letter-spacing:.8px;' + F + '">Úloha</div>' +
          '<div style="font-size:15px;font-weight:700;color:#002a4c;margin-bottom:18px;' + F + '">' + taskTitle + '</div>' +
          '<div style="border-left:3px solid #00adc6;padding-left:14px">' +
            '<div style="font-size:12px;color:#888;margin-bottom:6px;' + F + '">' + (commentAuthor ?? senderName) + ' &nbsp;·&nbsp; ' + formatDateTime(commentAt) + '</div>' +
            '<div style="font-size:14px;color:#333;line-height:1.65;font-style:italic;' + F + '">&ldquo;' + (commentText ?? '') + '&rdquo;</div>' +
          '</div>'
        ) +
        btn('Zobraziť komentár', accentColor)
      ) +
      ftr() +
      '</div></body></html>';
  }

  // completed
  const accentColor = '#1a6b2e';
  const completedAt = taskDeadline ? formatDateTime(taskDeadline) : formatDateTime(new Date().toISOString());
  return '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8"/><title>Úloha dokončená</title></head><body style="margin:0;padding:0;background:#e8eaed">' +
    '<div style="max-width:600px;margin:0 auto;background:#fff">' +
    hdr(accentColor) +
    bodyWrap(
      badge('Dokončené', '#e6f4ea', '#1a6b2e') +
      h1('Úloha bola dokončená') +
      para('<strong style="color:#002a4c">' + senderName + '</strong> označil vašu úlohu ako dokončenú.') +
      box(
        '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' +
          '<td><div style="font-size:16px;font-weight:700;color:#002a4c;margin-bottom:14px;' + F + '">' + taskTitle + '</div>' +
            '<table cellpadding="0" cellspacing="0" border="0" width="100%">' +
              row('Projekt:', projLabel || '—') +
              row('Dokončil/a:', senderName) +
              row('Čas:', formatDateTime(new Date().toISOString())) +
            '</table></td>' +
          '<td style="vertical-align:middle;text-align:right;padding-left:16px;width:60px">' +
            '<div style="width:48px;height:48px;background:#1a6b2e;border-radius:50%;text-align:center;line-height:48px;font-size:26px;color:#fff;display:inline-block">&#10003;</div>' +
          '</td></tr></table>'
      ) +
      btn('Zobraziť úlohu', accentColor)
    ) +
    ftr() +
    '</div></body></html>';
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer '))
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

  const senderId = userData.user.id;

  let body: { type?: string; taskId?: string; recipientId?: string; commentText?: string; commentAuthor?: string; commentAt?: string };
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400, headers: corsHeaders }); }

  const { type, taskId, recipientId, commentText, commentAuthor, commentAt } = body;
  if (!type || !taskId || !recipientId)
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });

  const [{ data: task }, { data: recipient }, { data: sender }] = await Promise.all([
    supabase.from('tasks').select('id,title,status,deadline,description,priority,project_id,created_by,assigned_to').eq('id', taskId).single(),
    supabase.from('profiles').select('id,name,email').eq('id', recipientId).single(),
    supabase.from('profiles').select('id,name,email').eq('id', senderId).single(),
  ]);

  if (!recipient?.email)
    return new Response(JSON.stringify({ error: 'Recipient email not found' }), { status: 404, headers: corsHeaders });

  let projectRef = '', projectName = '';
  if (task?.project_id) {
    const { data: proj } = await supabase.from('projects').select('quote_number,customer_name').eq('id', task.project_id).single();
    if (proj) { projectRef = proj.quote_number ?? ''; projectName = proj.customer_name ?? ''; }
  }

  const notifType = type as NotifType;
  const senderDisplayName = sender?.name ?? 'Používateľ';
  const subject = buildSubject(notifType, task?.title ?? '', senderDisplayName);
  const html = buildHtml(notifType, {
    taskTitle:       task?.title        ?? '(bez názvu)',
    taskStatus:      (task?.status      ?? 'todo')   as TaskStatus,
    taskPriority:    (task?.priority    ?? 'medium') as Priority,
    taskDeadline:    task?.deadline     ?? null,
    taskDescription: task?.description  ?? null,
    senderName:      senderDisplayName,
    recipientName:   recipient?.name    ?? 'Kolega',
    projectRef,
    projectName,
    commentText:     commentText  ?? null,
    commentAuthor:   commentAuthor ?? null,
    commentAt:       commentAt    ?? null,
  });

  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey)
    return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 500, headers: corsHeaders });

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [recipient.email], subject, html }),
  });

  if (!resendRes.ok) {
    const e = await resendRes.text();
    console.error('[send-task-notification] Resend error:', resendRes.status, e);
    return new Response(
      JSON.stringify({ error: 'Failed to send email', detail: e }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const d = await resendRes.json() as { id: string };
  console.log('[send-task-notification] Email sent:', d.id, '->', recipient.email);
  return new Response(
    JSON.stringify({ ok: true, messageId: d.id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
