# Backup & Disaster Recovery Strategy

Critical procedures para recuperación de datos en caso de incident.

## 🟢 Supabase Automatic Backups

Supabase realiza backups automáticos:
- **Daily backups** — Retención de 7 días (free tier)
- **Point-in-time recovery** — Hasta 7 días atrás (free tier)
- **Location** — EU region (mhcpgjubmltcezxoysng.supabase.co)

### Verificar Status

```sql
-- Conectar a Supabase directamente
SELECT version();
SELECT pg_database.datname 
FROM pg_database 
WHERE datname = 'postgres';
```

## 🔴 Disaster Recovery Procedure

### Scenario 1: Database Corruption

**IF:** Data looks corrupted but queries still work
**THEN:**
```bash
# 1. Export data backup immediately
psql -h db.supabase.co -U postgres -d postgres \
  -c "COPY (SELECT * FROM alerts) TO STDOUT CSV;" > alerts_backup.csv

# 2. Contact Supabase support
# Dashboard → Settings → Support
# Request: Point-in-time restore to [timestamp]

# 3. Verify restore
SELECT COUNT(*) FROM alerts;
```

### Scenario 2: Accidental Mass Delete

**IF:** `DELETE FROM alerts WHERE 1=1` executed by mistake
**THEN:**
```bash
# 1. STOP the backend immediately
#    (disconnect backend from database)

# 2. In Supabase Dashboard:
#    - Go to Settings → Backups
#    - Select backup from [X] minutes ago
#    - Click "Restore"
#    - Confirm organization_id matches

# 3. Verify restore worked
#    SELECT COUNT(*) FROM alerts;

# 4. Resume backend
```

### Scenario 3: Ransomware / Account Compromise

**IF:** Attacker gains DB access
**THEN:**
```bash
# 1. DISCONNECT EVERYTHING
#    - Kill all backend connections
#    - Stop Render deployment
#    - Disable API keys in Vercel

# 2. Change Supabase credentials
#    Dashboard → Settings → Database → Reset Password
#    Generate new SUPABASE_ANON_KEY & SERVICE_ROLE_KEY

# 3. Restore from clean backup
#    (see above Scenario 2)

# 4. Review audit logs
#    SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100;

# 5. Restart with fresh credentials
```

## 📊 Backup Checklist (Weekly)

Run every Monday morning:

```bash
#!/bin/bash
# Weekly backup verification

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="./backups/$DATE"
mkdir -p "$BACKUP_DIR"

# Export all tables
psql -h db.supabase.co \
  -U postgres \
  -d postgres \
  -c "COPY (SELECT * FROM alerts) TO STDOUT CSV;" \
  > "$BACKUP_DIR/alerts.csv"

psql -h db.supabase.co \
  -U postgres \
  -d postgres \
  -c "COPY (SELECT * FROM cases) TO STDOUT CSV;" \
  > "$BACKUP_DIR/cases.csv"

psql -h db.supabase.co \
  -U postgres \
  -d postgres \
  -c "COPY (SELECT * FROM action_plans) TO STDOUT CSV;" \
  > "$BACKUP_DIR/action_plans.csv"

# Compress
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "✅ Backup complete: $BACKUP_DIR.tar.gz"
```

## 🔐 Credentials Backup

**CRITICAL:** Store separately from code

```bash
# Never commit:
❌ .env (with real secrets)
❌ Database passwords
❌ API keys

# Instead:
✅ Use environment variables in Render/Vercel
✅ Store master key in secure vault (1Password, AWS Secrets Manager)
✅ Rotate credentials quarterly
```

## 📍 Multi-Region Consideration

Current: Supabase EU region only

**For future resilience:**
```
Primary:   Supabase EU (mhcpgjubmltcezxoysng)
Failover:  Supabase US region (replicate data daily)
OR:        PostgreSQL managed (AWS RDS, Azure, Google Cloud)
```

## 🚨 Contact & Escalation

| Incident | Action | Time |
|----------|--------|------|
| Data looks wrong | Contact Supabase support | 15 min |
| Query slow/timeout | Check `pg_stat_statements` | 5 min |
| Credentials leaked | Rotate immediately, audit logs | 10 min |
| Region down | Failover to backup region | 1 hour |

**Supabase Support:** https://supabase.com/support

---

**Last Tested:** [TODO: Add date]  
**Next Review:** [TODO: Set quarterly]
