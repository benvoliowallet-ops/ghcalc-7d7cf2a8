
## Fix: Update FROM address in send-task-notification

**Problem**: The edge function sends from `no-reply@vora.sk` but the verified Resend domain is `no-repply.vora.sk` (subdomain). Resend rejects the email with a 403 because `vora.sk` is not verified — only the subdomain `no-repply.vora.sk` is.

**Fix**: One line change in the edge function, then redeploy.

- **File**: `supabase/functions/send-task-notification/index.ts` line 8
- **Change**: `const FROM = 'no-reply@vora.sk';` → `const FROM = 'no-reply@no-repply.vora.sk';`
- **Then**: Redeploy the edge function so the change takes effect

That's the entire change needed. No UI or hook changes required.
