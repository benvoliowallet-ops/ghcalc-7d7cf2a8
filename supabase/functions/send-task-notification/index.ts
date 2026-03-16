import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROM = 'no-reply@no-repply.vora.sk';

// Inline SVG logos
const SANFOG_PIKT_SVG = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"36\" height=\"36\" viewBox=\"0 0 36 36\"><rect width=\"36\" height=\"36\" rx=\"8\" fill=\"#fff\"/><circle cx=\"18\" cy=\"18\" r=\"14\" fill=\"none\" stroke=\"#111\" stroke-width=\"3\"/><path d=\"M6 16 Q18 10 30 16\" fill=\"none\" stroke=\"#111\" stroke-width=\"3\"/><path d=\"M6 20 Q18 26 30 20\" fill=\"none\" stroke=\"#111\" stroke-width=\"3\"/><circle cx=\"18\" cy=\"18\" r=\"3.5\" fill=\"#111\"/></svg>';
const SANFOG_FULL_SVG = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"110\" height=\"26\" viewBox=\"0 0 110 26\"><circle cx=\"13\" cy=\"13\" r=\"11\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.5\"/><path d=\"M3.5 13 Q13 8 22.5 13\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.5\"/><path d=\"M3.5 13 Q13 18 22.5 13\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.5\"/><circle cx=\"13\" cy=\"13\" r=\"3\" fill=\"#fff\"/><text x=\"30\" y=\"18\" font-family=\"Arial,sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#fff\">sanfog</text></svg>';
const VORA_SVG = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"60\" height=\"28\" viewBox=\"0 0 60 28\"><text x=\"0\" y=\"10\" font-family=\"Arial,sans-serif\" font-size=\"9\" font-weight=\"bold\" fill=\"#64748b\" letter-spacing=\"2\">VORA</text><rect x=\"0\" y=\"14\" width=\"60\" height=\"1\" fill=\"#e2e8f0\"/><text x=\"0\" y=\"26\" font-family=\"Arial,sans-serif\" font-size=\"8\" fill=\"#94a3b8\">solutions</text></svg>';

function toDataUri(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function buildSubject(type, taskTitle) {
  const map = { assigned: 'Nova uloha: ' + taskTitle, completed: 'Uloha dokoncena: ' + taskTitle, comment: 'Novy komentar k ulohe: ' + taskTitle };
  return map[type] ?? 'Aktualizacia ulohy: ' + taskTitle;
}
function priorityLabel(p) { return ({urgent:'URGENTNA',high:'VYSOKA',medium:'STREDNA',low:'NIZKA'})[p] ?? 'STREDNA'; }
function priorityColor(p) { return ({urgent:'#dc2626',high:'#ea580c',medium:'#b45309',low:'#0d9488'})[p] ?? '#b45309'; }
function priorityBg(p) { return ({urgent:'#fef2f2',high:'#fff7ed',medium:'#fffbeb',low:'#f0fdfa'})[p] ?? '#fffbeb'; }
function statusLabel(s) { return ({todo:'Todo',in_progress:'V rieseni',done:'Dokoncene'})[s] ?? 'Todo'; }
function statusColor(s) { return ({todo:'#94a3b8',in_progress:'#f59e0b',done:'#0d9488'})[s] ?? '#94a3b8'; }
function formatDeadline(d) {
  if (!d) return '&mdash;';
  const dt = new Date(d);
  const overdue = dt < new Date();
  const fmt = dt.toLocaleDateString('sk-SK', {day:'2-digit',month:'2-digit',year:'numeric'});
  return overdue ? '<span style="color:#dc2626;font-weight:600">' + fmt + ' &middot; Oneskorene</span>' : fmt;
}

function buildHtml(type, payload) {
  const { taskTitle, taskStatus, taskPriority, taskDeadline, taskDescription, senderName, recipientName, projectRef, projectName } = payload;
  let headline = '', body = '', bannerColor = '#0d9488', icon = '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>';
  if (type === 'assigned') { headline = 'Bola vam priradena nova uloha'; body = '<strong style="color:#0d9488">' + recipientName + '</strong>, ' + senderName + ' vam priradil/a novu ulohu v GreenHouse Calc.'; }
  else if (type === 'completed') { headline = 'Uloha bola dokoncena'; body = '<strong style="color:#0d9488">' + recipientName + '</strong>, vasa uloha bola oznacena ako dokoncena.'; icon = '<polyline points="20 6 9 17 4 12"/>'; }
  else if (type === 'comment') { headline = 'Novy komentar k vasej ulohe'; body = '<strong style="color:#0d9488">' + recipientName + '</strong>, ' + senderName + ' pridal/a komentar.'; bannerColor = '#0f766e'; icon = '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>'; }
  else { headline = 'Aktualizacia ulohy'; body = 'Uloha <strong>' + taskTitle + '</strong> bola aktualizovana.'; }
  const descBlock = taskDescription ? '<tr><td style="color:#94a3b8;padding:5px 0;width:90px;vertical-align:top;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase">Popis</td><td style="padding:5px 0"><div style="background:#f8fafc;border-left:2px solid #0d9488;padding:8px 10px;font-size:13px;color:#334155;line-height:1.6;border-radius:0 4px 4px 0">' + taskDescription + '</div></td></tr>' : '';
  const projLabel = projectRef + (projectName ? ' &middot; ' + projectName : '');
  const piktUri = toDataUri(SANFOG_PIKT_SVG);
  const fullUri = toDataUri(SANFOG_FULL_SVG);
  const voraUri = toDataUri(VORA_SVG);
  return '<!DOCTYPE html><html lang="sk"><head><meta charset="UTF-8"/><title>' + headline + '</title></head><body style="margin:0;padding:32px 16px;background:#f0f4f8;font-family:Segoe UI,system-ui,sans-serif">'
    + '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">'
    + '<div style="background:#0a2236;padding:18px 24px;display:flex;align-items:center;justify-content:space-between">'
    + '<div style="display:flex;align-items:center;gap:12px">'
    + '<img src="' + piktUri + '" width="36" height="36" alt="Sanfog" style="border-radius:8px"/>'
    + '<div><div style="color:#fff;font-size:14px;font-weight:700;letter-spacing:.02em">GreenHouse Calc</div><div style="color:rgba(255,255,255,.4);font-size:11px;margin-top:1px">Task Notification</div></div></div>'
    + '<img src="' + fullUri + '" height="26" alt="sanfog" style="display:block"/>'
    + '</div>'
    + '<div style="background:' + bannerColor + ';padding:12px 24px;display:flex;align-items:center;gap:10px">'
    + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">' + icon + '</svg>'
    + '<span style="color:#fff;font-size:14px;font-weight:700">' + headline + '</span></div>'
    + '<div style="padding:24px"><p style="font-size:14px;color:#475569;margin:0 0 18px;line-height:1.6">Ahoj ' + body + '</p>'
    + '<div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:18px">'
    + '<div style="background:#f8fafc;padding:12px 16px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between">'
    + '<span style="font-size:14px;font-weight:700;color:#0a2236">' + taskTitle + '</span>'
    + '<span style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:999px;background:' + priorityBg(taskPriority) + ';color:' + priorityColor(taskPriority) + ';letter-spacing:.05em">' + priorityLabel(taskPriority) + '</span>'
    + '</div><div style="padding:12px 16px"><table style="width:100%;border-collapse:collapse">'
    + '<tr><td style="color:#94a3b8;padding:5px 0;width:90px;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase">Projekt</td>'
    + '<td style="padding:5px 0"><span style="display:inline-flex;align-items:center;gap:5px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:5px;padding:3px 9px;font-size:12px;color:#0d9488;font-weight:600">'
    + '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>'
    + projLabel + '</span></td></tr>'
    + '<tr><td style="color:#94a3b8;padding:5px 0;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase">Stav</td>'
    + '<td style="padding:5px 0"><span style="display:inline-flex;align-items:center;gap:6px">'
    + '<span style="width:7px;height:7px;border-radius:50%;background:' + statusColor(taskStatus) + ';display:inline-block"></span>'
    + '<span style="font-size:13px;color:#1e293b">' + statusLabel(taskStatus) + '</span></span></td></tr>'
    + '<tr><td style="color:#94a3b8;padding:5px 0;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase">Deadline</td>'
    + '<td style="padding:5px 0;font-size:13px;color:#1e293b">' + formatDeadline(taskDeadline) + '</td></tr>'
    + '<tr><td style="color:#94a3b8;padding:5px 0;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase">Priradil</td>'
    + '<td style="padding:5px 0;color:#1e293b;font-size:13px">' + senderName + '</td></tr>'
    + descBlock + '</table></div></div>'
    + '<div style="text-align:center;margin:20px 0 4px"><a href="https://ghcalc.lovable.app" style="display:inline-block;background:#0d9488;color:#fff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:.02em">Otvorit ulohu v aplikacii &rarr;</a></div></div>'
    + '<div style="background:#fff;border-top:1px solid #e2e8f0;padding:14px 24px;display:flex;align-items:center;justify-content:space-between">'
    + '<div style="font-size:11px;color:#94a3b8;line-height:1.7"><strong style="color:#64748b">GreenHouse Calc</strong> &middot; Sanfog s.r.o.<br>Tato sprava bola vygenerovana automaticky. Neodpovedajte.</div>'
    + '<img src="' + voraUri + '" height="28" alt="VORA" style="display:block"/>'
    + '</div></div></body></html>';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const token = authHeader.replace('Bearer ', '');
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  const senderId = userData.user.id;
  let body; try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400, headers: corsHeaders }); }
  const { type, taskId, recipientId } = body;
  if (!type || !taskId || !recipientId) return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
  const [{ data: task }, { data: recipient }, { data: sender }] = await Promise.all([
    supabase.from('tasks').select('id,title,status,deadline,description,priority,project_id,created_by,assigned_to').eq('id', taskId).single(),
    supabase.from('profiles').select('id,name,email').eq('id', recipientId).single(),
    supabase.from('profiles').select('id,name,email').eq('id', senderId).single(),
  ]);
  if (!recipient?.email) return new Response(JSON.stringify({ error: 'Recipient email not found' }), { status: 404, headers: corsHeaders });
  let projectRef = '', projectName = '';
  if (task?.project_id) {
    const { data: proj } = await supabase.from('projects').select('quote_number,customer_name').eq('id', task.project_id).single();
    if (proj) { projectRef = proj.quote_number ?? ''; projectName = proj.customer_name ?? ''; }
  }
  const subject = buildSubject(type, task?.title ?? '');
  const html = buildHtml(type, { taskTitle: task?.title ?? '(bez nazvu)', taskStatus: task?.status ?? 'todo', taskPriority: task?.priority ?? 'medium', taskDeadline: task?.deadline ?? null, taskDescription: task?.description ?? null, senderName: sender?.name ?? 'Neznamy', recipientName: recipient?.name ?? 'Kolega', projectRef, projectName });
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 500, headers: corsHeaders });
  const resendRes = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM, to: [recipient.email], subject, html }) });
  if (!resendRes.ok) { const e = await resendRes.text(); console.error('[send-task-notification] Resend error:', resendRes.status, e); return new Response(JSON.stringify({ error: 'Failed to send email', detail: e }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
  const d = await resendRes.json();
  console.log('[send-task-notification] Email sent:', d.id, '->', recipient.email);
  return new Response(JSON.stringify({ ok: true, messageId: d.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});