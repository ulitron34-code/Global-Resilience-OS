# Security Hardening Checklist

Pre-production security verification.

## 🔐 Environment Variables

### Backend (Render)
- [x] PORT ← Inyectado por Render
- [x] NODE_ENV=production
- [x] AUTH_SECRET ← Generado con `openssl rand -base64 32`
- [x] SUPABASE_URL ← URL de Supabase
- [x] SUPABASE_SERVICE_ROLE_KEY ← Clave de servicio (SECRET)
- [x] CORS_ORIGIN ← Whitelist de frontend
- [x] SENTRY_DSN ← (nuevo, opcional)
- [x] ANTHROPIC_API_KEY ← (si usas Copilot)
- [x] OPENAI_API_KEY ← (si usas OpenAI)

**Verificar:**
```bash
# En Render dashboard, Settings → Environment:
# ❌ Nunca mostrar valores en logs
# ✅ Marcar como "SECRET"
# ✅ Usar solo en production environment
```

### Frontend (Vercel)
- [x] VITE_BACKEND_URL ← URL del backend
- [x] VITE_SENTRY_DSN ← (nuevo, opcional)

**Nota:** Valores VITE_* se exponen en cliente (no poner secrets)

## 🚫 Secrets Management

### ❌ NUNCA hacer:
```javascript
const SECRET = "my-secret-key-123"  // ❌ En código
process.env.SECRET = "hardcoded"     // ❌ Hardcoded
```

### ✅ SIEMPRE hacer:
```javascript
const SECRET = process.env.AUTH_SECRET;
if (!SECRET) throw new Error('AUTH_SECRET not set');
```

### Rotation Schedule
```
AUTH_SECRET: Quarterly (ó cuando alguien se va)
SUPABASE_KEYS: Quarterly
API_KEYS (third-party): Quarterly
JWT_SECRET: Quarterly
```

## 🔒 Database Security

### Supabase RLS (Row Level Security)

**Verificar está habilitado:**
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

Expected output:
```
 schemaname | tablename       | rowsecurity
 public     | alerts          | t
 public     | cases           | t
 public     | action_plans    | t
```

**Si aparece FALSE, ejecutar:**
```sql
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
```

### Políticas RLS Verificadas
```sql
SELECT tablename, policyname, permissive, roles, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

Should show organization-level isolation policies.

## 🌐 CORS & Headers

### Backend Headers Check
```bash
curl -I https://global-resilience-os.onrender.com/api/health

# Expected:
# x-frame-options: DENY
# x-content-type-options: nosniff
# referrer-policy: no-referrer
# content-security-policy: default-src 'none'
# permissions-policy: camera=(), microphone=(), geolocation=()
```

### CORS Whitelist
```javascript
// In server.js
const configuredOrigins = process.env.CORS_ORIGIN
  .split(',')
  .map(o => o.trim());
// Should only include:
// - https://global-resilience-os.vercel.app (production)
// - http://localhost:5173 (development only)
```

## 🔑 API Keys & Tokens

### Supabase Anon vs Service Role
```
SUPABASE_ANON_KEY:
  ✅ Safe to embed in frontend
  ✅ Limited by RLS policies
  ✅ User must be authenticated

SUPABASE_SERVICE_ROLE_KEY:
  ❌ NEVER expose in frontend
  ✅ Backend-only (bypasses RLS)
  ✅ Treat as password
```

### Rotation Procedure
```bash
# 1. In Supabase Dashboard → Settings → API
#    Copy OLD key
#    Click "Rotate" → confirm
#    Copy NEW key

# 2. Update in Render:
#    Settings → Environment Variables
#    SUPABASE_SERVICE_ROLE_KEY = [NEW]

# 3. Redeploy backend
#    (Render auto-redeploys)

# 4. Test:
#    curl https://api.domain.com/api/health
#    Should return 200 OK
```

## 🛡️ Dependency Security

### Audit Script (Run Weekly)
```bash
#!/bin/bash
echo "=== Backend Audit ==="
cd backend && npm audit --production

echo "=== Frontend Audit ==="
cd ../frontend && npm audit --production

echo "=== Check Outdated ==="
npm outdated --all
```

### Known Issues to Watch
- jsPDF (PDF library) — Check for CVE in XSS
- html2canvas (if used) — DOM parsing risks
- Recharts (charting) — Usually safe but audit SVG injection

## 📋 Pre-Launch Checklist

### Week Before Launch
- [ ] Run `npm audit` in both directories
- [ ] Run security headers curl check
- [ ] Verify RLS policies in Supabase
- [ ] Rotate all API keys
- [ ] Test Sentry error capture
- [ ] Backup verification (export tables)

### Day Before Launch
- [ ] Run full test suite: `npm run verify`
- [ ] Manual smoke test on production URLs
- [ ] Check logs for errors
- [ ] Verify all env vars set in Render/Vercel
- [ ] Document emergency contacts

### Launch Day
- [ ] Monitor error tracking (Sentry)
- [ ] Check uptime dashboard
- [ ] Be ready to rollback (keep previous version tagged)
- [ ] Have incident response team on standby

## 🚨 Incident Response

### If Breach Detected
```
1. STOP — Pause backend deployment immediately
2. ASSESS — What was accessed? (Check audit_log)
3. CONTAIN — Rotate compromised keys
4. COMMUNICATE — Alert users (if data exposed)
5. RECOVER — Restore from backup if needed
6. REVIEW — Post-incident analysis
```

### Key Contacts
```
Supabase Support: https://supabase.com/support
GitHub Security: https://github.com/contact/security
Sentry Alerts: Configure in https://sentry.io/settings/alerts/
```

---

**Reviewed:** [Add date when this was last verified]  
**Next Review:** [Quarterly]  
**Last Incident:** None
