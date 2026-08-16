import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const supabaseDocsDir = join(root, 'docs', 'supabase');

// Read all 001 to 005 SQL files in sorted order
const files = readdirSync(supabaseDocsDir)
  .filter((f) => f.endsWith('.sql') && !f.includes('combined'))
  .sort();

console.log('📄 Archivos de migración a consolidar:', files);

let combinedSql = `-- GLOBAL RESILIENCE OS - CONSOLIDATED SUPABASE SCHEMA (001 - 005)\n`;
combinedSql += `-- Generado automáticamente: ${new Date().toISOString()}\n\n`;

for (const file of files) {
  const filePath = join(supabaseDocsDir, file);
  const content = readFileSync(filePath, 'utf8');
  combinedSql += `-- ==========================================\n`;
  combinedSql += `-- SECCIÓN: ${file}\n`;
  combinedSql += `-- ==========================================\n\n`;
  combinedSql += content + '\n\n';
}

const outputPath = join(supabaseDocsDir, 'full_schema_combined.sql');
writeFileSync(outputPath, combinedSql, 'utf8');
console.log(`✅ Archivo consolidado creado en: ${outputPath}`);

console.log('\n======================================================');
console.log('🚀 OPCIONES PARA EJECUTAR EN SUPABASE DESDE GIT BASH:');
console.log('======================================================\n');
console.log('Opción 1: Con Supabase CLI (Si estás vinculado con supabase link)');
console.log(`  npx supabase db query --file docs/supabase/full_schema_combined.sql\n`);
console.log('Opción 2: Con psql (Directo a tu base de datos de Supabase)');
console.log(`  psql "postgres://postgres:[TU_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" -f docs/supabase/full_schema_combined.sql\n`);
console.log('Opción 3: Copiar todo el archivo consolidado al SQL Editor en Supabase Dashboard:');
console.log(`  Archivo: docs/supabase/full_schema_combined.sql\n`);
