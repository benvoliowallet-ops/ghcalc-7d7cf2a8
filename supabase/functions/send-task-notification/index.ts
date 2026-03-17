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
}

// ─── Real brand SVGs (inlined from project assets) ───────────────────────────

// Piktogram only — crop to the globe/waves icon area of the full logo SVG
const SANFOG_PIKT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 34 45 43" width="40" height="40">
  <rect x="30" y="34" width="45" height="43" rx="8" fill="#0a2236"/>
  <path fill="#ffffff" d="M44.29,51.52a7.88,7.88,0,0,1,15.29-.13,19.66,19.66,0,0,0,9.48-2.78,17.76,17.76,0,0,0-34.24.08,19.69,19.69,0,0,0,9.47,2.84"/>
  <path fill="#ffffff" d="M59.71,54.8a7.89,7.89,0,0,1-15.49.14,23.29,23.29,0,0,0-9.55,2.55,17.76,17.76,0,0,0,34.6-.16,23.3,23.3,0,0,0-9.56-2.54"/>
</svg>`;

// Full horizontal logo — white version (piktogram + sanfog wordmark)
const SANFOG_FULL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 239.38 109.13" width="130" height="30">
  <path fill="#ffffff" d="M44.29,51.52a7.88,7.88,0,0,1,15.29-.13,19.66,19.66,0,0,0,9.48-2.78,17.76,17.76,0,0,0-34.24.08,19.69,19.69,0,0,0,9.47,2.84"/>
  <path fill="#ffffff" d="M59.71,54.8a7.89,7.89,0,0,1-15.49.14,23.29,23.29,0,0,0-9.55,2.55,17.76,17.76,0,0,0,34.6-.16,23.3,23.3,0,0,0-9.56-2.54"/>
  <path fill="#ffffff" d="M97.72,49.22a6.82,6.82,0,0,0-4.23-1.3c-1.7,0-2.57.61-2.57,1.48s.9,1.52,2.64,1.55c3.51.11,7.73.83,7.77,5.75,0,2.89-2.13,6-7.81,6a12.12,12.12,0,0,1-8.38-3L87.39,56a9.55,9.55,0,0,0,6.22,2.24c1.52,0,2.71-.58,2.67-1.52s-.61-1.52-3-1.59c-3.32-.15-7.48-1.52-7.48-5.71s3.83-5.75,7.7-5.75A9.87,9.87,0,0,1,100.29,46Z"/>
  <path fill="#ffffff" d="M108.63,53.09a4.47,4.47,0,0,0,4.7,4.7,4.72,4.72,0,1,0,0-9.43,4.5,4.5,0,0,0-4.7,4.73m9.61-8.93h4.88V62h-4.7l-.29-2.24c-1.19,1.88-3.76,2.6-5.49,2.64-5.35,0-9.21-3.43-9.21-9.32s4.08-9.4,9.36-9.32c2.24,0,4.34.87,5.28,2.46Z"/>
  <path fill="#ffffff" d="M140.39,62V52.58c0-2.75-1.19-4.16-3.69-4.16a4.14,4.14,0,0,0-4,4.37V62h-5.13V44.17h4.7l.18,2.28a6.73,6.73,0,0,1,5.78-2.71c4,0,7.44,1.88,7.44,8.82V62Z"/>
  <path fill="#ffffff" d="M177.5,53.13a4.5,4.5,0,1,0-9,0A4.35,4.35,0,0,0,173,57.79c3.18,0,4.52-2.31,4.52-4.66m-14.27,0c0-5.38,3.83-9.36,9.76-9.36s9.79,4,9.79,9.36-3.72,9.29-9.79,9.29-9.76-3.9-9.76-9.29"/>
  <path fill="#ffffff" d="M156.76,43.44a2.45,2.45,0,0,1,2.64-2.75,5.07,5.07,0,0,1,2.32.58V36.75a8.28,8.28,0,0,0-2.94-.5c-3.47,0-7.23,2-7.23,7.19v1h-3.14v4.37h3.14V62h5.2V48.86h4.95V44.49h-4.95Z"/>
  <path fill="#ffffff" d="M194.93,48.43a4.41,4.41,0,0,1,4.52,4.7c0,2.35-1.34,4.66-4.52,4.66a4.35,4.35,0,0,1-4.48-4.66,4.4,4.4,0,0,1,4.48-4.7m6.7,11.79a9,9,0,0,0,3.1-7.09c0-5.38-3.83-9.36-9.79-9.36s-9.76,4-9.76,9.36a8.73,8.73,0,0,0,6,8.71,12,12,0,0,0,3.93.62c3.22,0,4.34,1.34,4.34,3.07,0,2.2-2.1,3.29-4.41,3.29s-4.3-.87-4.48-3.61h-4.84c-.07,5.13,3.14,8.2,9.32,8.2,4.91,0,9.68-2.57,9.68-7.88a5.62,5.62,0,0,0-3.12-5.31"/>
</svg>`;

// VORA wordmark — styled SVG text (no vector asset available)
const VORA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="30" viewBox="0 0 72 30">
  <text x="0" y="13" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="#0a2236" letter-spacing="3">VORA</text>
  <rect x="0" y="17" width="72" height="1.5" fill="#0d9488" rx="1"/>
  <text x="0" y="28" font-family="Arial,sans-serif" font-size="8" fill="#64748b" letter-spacing="1.5">solutions</text>
</svg>`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDataUri(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function buildSubject(type: NotifType, taskTitle: string): string {
  const map: Record<NotifType, string> = {
    assigned:  'Nova uloha: '               + taskTitle,
    completed: 'Uloha dokoncena: '          + taskTitle,
    comment:   'Novy komentar k ulohe: '   + taskTitle,
  };
  return map[type] ?? 'Aktualizacia ulohy: ' + taskTitle;
}

function priorityLabel(p: Priority): string {
  return ({ urgent: 'URGENTNA', high: 'VYSOKA', medium: 'STREDNA', low: 'NIZKA' } as Record<Priority, string>)[p] ?? 'STREDNA';
}
function priorityColor(p: Priority): string {
  return ({ urgent: '#dc2626', high: '#ea580c', medium: '#b45309', low: '#0d9488' } as Record<Priority, string>)[p] ?? '#b45309';
}
function priorityBg(p: Priority): string {
  return ({ urgent: '#fef2f2', high: '#fff7ed', medium: '#fffbeb', low: '#f0fdfa' } as Record<Priority, string>)[p] ?? '#fffbeb';
}
function statusLabel(s: TaskStatus): string {
  return ({ todo: 'Todo', in_progress: 'V rieseni', done: 'Dokoncene' } as Record<TaskStatus, string>)[s] ?? 'Todo';
}
function statusColor(s: TaskStatus): string {
  return ({ todo: '#94a3b8', in_progress: '#f59e0b', done: '#0d9488' } as Record<TaskStatus, string>)[s] ?? '#94a3b8';
}
function formatDeadline(d: string | null): string {
  if (!d) return '&mdash;';
  const dt = new Date(d);
  const overdue = dt < new Date();
  const fmt = dt.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return overdue
    ? '<span style="color:#dc2626;font-weight:600">' + fmt + ' &middot; Oneskorene</span>'
    : fmt;
}

function buildHtml(type: NotifType, payload: HtmlPayload): string {
  const {
    taskTitle, taskStatus, taskPriority, taskDeadline,
    taskDescription, senderName, recipientName, projectRef, projectName,
  } = payload;

  let headline = '', body = '', bannerColor = '#0d9488';
  let icon = '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>';

  if (type === 'assigned') {
    headline = 'Bola vam priradena nova uloha';
    body = '<strong style="color:#0d9488">' + recipientName + '</strong>, ' + senderName + ' vam priradil/a novu ulohu v GreenHouse Calc.';
  } else if (type === 'completed') {
    headline = 'Uloha bola dokoncena';
    body = '<strong style="color:#0d9488">' + recipientName + '</strong>, vasa uloha bola oznacena ako dokoncena.';
    icon = '<polyline points="20 6 9 17 4 12"/>';
  } else if (type === 'comment') {
    headline = 'Novy komentar k vasej ulohe';
    body = '<strong style="color:#0d9488">' + recipientName + '</strong>, ' + senderName + ' pridal/a komentar.';
    bannerColor = '#f38f00';
    icon = '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>';
  } else {
    headline = 'Aktualizacia ulohy';
    body = 'Uloha <strong>' + taskTitle + '</strong> bola aktualizovana.';
  }

  const descBlock = taskDescription
    ? '<tr><td style="color:#94a3b8;padding:5px 0;width:90px;vertical-align:top;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase">Popis</td>'
      + '<td style="padding:5px 0"><div style="background:#f8fafc;border-left:2px solid #0d9488;padding:8px 10px;font-size:13px;color:#334155;line-height:1.6;border-radius:0 4px 4px 0">'
      + taskDescription + '</div></td></tr>'
    : '';

  const projLabel = projectRef + (projectName ? ' &middot; ' + projectName : '');

  const piktUri = toDataUri(SANFOG_PIKT_SVG);
  const fullUri = toDataUri(SANFOG_FULL_SVG);
  const voraUri = toDataUri(VORA_SVG);

  return (
    '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8"/><title>' + headline + '</title></head>'
    + '<body style="margin:0;padding:32px 16px;background:#f0f4f8;font-family:Segoe UI,system-ui,sans-serif">'
    + '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">'

    // ── Header ──
    + '<div style="background:#0a2236;padding:18px 24px;display:flex;align-items:center;justify-content:space-between">'
    + '<div style="display:flex;align-items:center;gap:12px">'
    + '<img src="' + piktUri + '" width="40" height="40" alt="Sanfog" style="border-radius:8px;display:block"/>'
    + '<div>'
    + '<div style="color:#fff;font-size:14px;font-weight:700;letter-spacing:.02em">GreenHouse Calc</div>'
    + '<div style="color:rgba(255,255,255,.45);font-size:11px;margin-top:1px">Task Notification</div>'
    + '</div></div>'

    + '</div>'

    // ── Banner ──
    + '<div style="background:' + bannerColor + ';padding:12px 24px;display:flex;align-items:center;gap:10px">'
    + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">' + icon + '</svg>'
    + '<span style="color:#fff;font-size:14px;font-weight:700">' + headline + '</span>'
    + '</div>'

    // ── Body ──
    + '<div style="padding:24px">'
    + '<p style="font-size:14px;color:#475569;margin:0 0 18px;line-height:1.6">Ahoj ' + body + '</p>'

    // ── Task card ──
    + '<div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:18px">'
    + '<div style="background:#f8fafc;padding:12px 16px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between">'
    + '<span style="font-size:14px;font-weight:700;color:#0a2236">' + taskTitle + '</span>'
    + '<span style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:999px;background:'
    + priorityBg(taskPriority) + ';color:' + priorityColor(taskPriority) + ';letter-spacing:.05em">'
    + priorityLabel(taskPriority) + '</span>'
    + '</div>'
    + '<div style="padding:12px 16px"><table style="width:100%;border-collapse:collapse">'

    // Project row
    + '<tr><td style="color:#94a3b8;padding:5px 0;width:90px;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase">Projekt</td>'
    + '<td style="padding:5px 0"><span style="display:inline-flex;align-items:center;gap:5px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:5px;padding:3px 9px;font-size:12px;color:#0d9488;font-weight:600">'
    + '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>'
    + projLabel + '</span></td></tr>'

    // Status row
    + '<tr><td style="color:#94a3b8;padding:5px 0;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase">Stav</td>'
    + '<td style="padding:5px 0"><span style="display:inline-flex;align-items:center;gap:6px">'
    + '<span style="width:7px;height:7px;border-radius:50%;background:' + statusColor(taskStatus) + ';display:inline-block"></span>'
    + '<span style="font-size:13px;color:#1e293b">' + statusLabel(taskStatus) + '</span>'
    + '</span></td></tr>'

    // Deadline row
    + '<tr><td style="color:#94a3b8;padding:5px 0;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase">Deadline</td>'
    + '<td style="padding:5px 0;font-size:13px;color:#1e293b">' + formatDeadline(taskDeadline) + '</td></tr>'

    // Sender row
    + '<tr><td style="color:#94a3b8;padding:5px 0;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase">Priradil</td>'
    + '<td style="padding:5px 0;color:#1e293b;font-size:13px">' + senderName + '</td></tr>'

    + descBlock
    + '</table></div></div>'

    // CTA
    + '<div style="text-align:center;margin:20px 0 4px">'
    + '<a href="https://ghcalc.lovable.app" style="display:inline-block;background:#0d9488;color:#fff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:.02em">Otvorit ulohu v aplikacii &rarr;</a>'
    + '</div>'
    + '</div>'

    // ── Footer ──
    + '<div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 24px;display:flex;align-items:center;justify-content:space-between">'
    + '<div style="font-size:11px;color:#94a3b8;line-height:1.7">'
    + '<strong style="color:#64748b">GreenHouse Calc</strong> &middot; Sanfog s.r.o.<br>'
    + 'Tato sprava bola vygenerovana automaticky. Neodpovedajte.'
    + '</div>'
    + '<img src="' + voraUri + '" height="30" alt="VORA" style="display:block"/>'
    + '</div>'

    + '</div></body></html>'
  );
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

  let body: { type?: string; taskId?: string; recipientId?: string };
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400, headers: corsHeaders }); }

  const { type, taskId, recipientId } = body;
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
  const subject = buildSubject(notifType, task?.title ?? '');
  const html = buildHtml(notifType, {
    taskTitle:       task?.title        ?? '(bez nazvu)',
    taskStatus:      (task?.status      ?? 'todo')   as TaskStatus,
    taskPriority:    (task?.priority    ?? 'medium') as Priority,
    taskDeadline:    task?.deadline     ?? null,
    taskDescription: task?.description  ?? null,
    senderName:      sender?.name       ?? 'Neznamy',
    recipientName:   recipient?.name    ?? 'Kolega',
    projectRef,
    projectName,
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
