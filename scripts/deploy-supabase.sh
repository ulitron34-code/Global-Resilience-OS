#!/usr/bin/env bash
# Deploy all Global Resilience OS migrations to Supabase from Git Bash
set -e

echo "🚀 Consolidando migraciones de Supabase..."
node scripts/apply-supabase-migrations.js

if [ -n "$DATABASE_URL" ]; then
  echo "📡 Aplicando full_schema_combined.sql a Supabase mediante DATABASE_URL..."
  psql "$DATABASE_URL" -f docs/supabase/full_schema_combined.sql
  echo "✅ ¡Migraciones aplicadas con éxito a Supabase!"
elif [ -n "$SUPABASE_PROJECT_REF" ]; then
  echo "🔗 Vinculando proyecto de Supabase ($SUPABASE_PROJECT_REF)..."
  npx supabase db query --file docs/supabase/full_schema_combined.sql --project-ref "$SUPABASE_PROJECT_REF"
  echo "✅ ¡Migraciones aplicadas con éxito a Supabase!"
else
  echo "⚠️  DATABASE_URL o SUPABASE_PROJECT_REF no configurado en el entorno."
  echo "Puedes ejecutar una de las siguientes opciones en Git Bash:"
  echo ""
  echo "  1) Si tienes la URL de conexión Postgres (DATABASE_URL):"
  echo "     psql \"postgres://postgres:TU_PASSWORD@db.TU_PROJECT_REF.supabase.co:5432/postgres\" -f docs/supabase/full_schema_combined.sql"
  echo ""
  echo "  2) Si tienes Supabase CLI vinculado:"
  echo "     npx supabase db query --file docs/supabase/full_schema_combined.sql"
  echo ""
  echo "  3) O copiar el contenido de docs/supabase/full_schema_combined.sql al SQL Editor en https://supabase.com/dashboard"
fi
