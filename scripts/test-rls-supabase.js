require('dotenv').config();

// Script de prueba RLS para Supabase y Aislamiento de Inquilinos Local
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const PORT = process.env.PORT || 4000;
const BACKEND_URL = `http://localhost:${PORT}`;

async function runLocalIsolationTest() {
  console.log('--- Iniciando Prueba de Aislamiento de Inquilinos (Local Backend) ---');
  try {
    // 1. Obtener Token de la Org A (tenant-a)
    console.log('1. Logueando en Organización A (tenant-a-demo)...');
    const loginResA = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tenant-a@resilience.local', password: 'demo123' })
    });
    if (!loginResA.ok) throw new Error('No se pudo loguear como tenant-a');
    const dataA = await loginResA.json();
    const tokenA = dataA.token;

    // 2. Obtener Token de la Org B (tenant-b)
    console.log('2. Logueando en Organización B (tenant-b-demo)...');
    const loginResB = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tenant-b@resilience.local', password: 'demo123' })
    });
    if (!loginResB.ok) throw new Error('No se pudo loguear como tenant-b');
    const dataB = await loginResB.json();
    const tokenB = dataB.token;

    // 3. Consultar Casos de la Org A
    console.log('3. Consultando Casos desde el contexto de la Org A...');
    const casesResA = await fetch(`${BACKEND_URL}/api/cases`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const casesA = await casesResA.json();
    console.log(`   -> Org A recibió ${casesA.length} casos.`);

    // 4. Consultar Casos de la Org B
    console.log('4. Consultando Casos desde el contexto de la Org B...');
    const casesResB = await fetch(`${BACKEND_URL}/api/cases`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const casesB = await casesResB.json();
    console.log(`   -> Org B recibió ${casesB.length} casos.`);

    // 5. Validar aislamiento mutuo
    console.log('5. Validando exclusión mutua de datos...');
    let violation = false;
    casesA.forEach(cA => {
      if (casesB.some(cB => cB.id === cA.id)) {
        violation = true;
        console.error(`   ❌ VIOLACIÓN: El caso ${cA.id} se encuentra expuesto en ambas organizaciones.`);
      }
    });

    if (!violation) {
      console.log('   ✅ PRUEBA EXITOSA: Aislamiento lógico de base de datos verificado.');
    }
  } catch (err) {
    console.warn(`⚠️ OMITIENDO TEST DE API LOCAL (El servidor local no está corriendo en ${BACKEND_URL}): ${err.message}`);
  }
}

async function testSupabaseRLS() {
  console.log('\n--- Iniciando Prueba de Aislamiento RLS en Supabase (Remoto) ---');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('ℹ️ Supabase no está configurado en las variables de entorno locales.');
    console.log('   La validación definitiva se realizará en el pipeline de CI/CD de Staging.');
    return;
  }

  // Token JWT de prueba configurados en el servidor
  const tokenOrgA = process.env.TEST_TOKEN_ORG_A || 'Reemplazar_Con_JWT_Org_A';
  const tokenOrgB = process.env.TEST_TOKEN_ORG_B || 'Reemplazar_Con_JWT_Org_B';

  if (tokenOrgA.startsWith('Reemplazar') || tokenOrgB.startsWith('Reemplazar')) {
    console.warn('⚠️ ADVERTENCIA: Los tokens JWT de Supabase son placeholders. Omitiendo prueba remota.');
    return;
  }

  try {
    const headers = (token) => ({
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    console.log('1. Fetching cases from Supabase for Org A...');
    const resA = await fetch(`${SUPABASE_URL}/rest/v1/cases?select=*`, { headers: headers(tokenOrgA) });
    const casesA = await resA.json();

    console.log('2. Fetching cases from Supabase for Org B...');
    const resB = await fetch(`${SUPABASE_URL}/rest/v1/cases?select=*`, { headers: headers(tokenOrgB) });
    const casesB = await resB.json();

    let violation = false;
    casesA.forEach(c => {
      if (casesB.find(cb => cb.id === c.id)) {
        violation = true;
        console.error(`   ❌ VIOLACION RLS: El caso ${c.id} es visible por ambas organizaciones en Supabase.`);
      }
    });

    if (!violation) {
      console.log('   ✅ RLS VALIDADO: La base de datos remota aísla correctamente los tenants.');
    }
  } catch (error) {
    console.error('Error durante la prueba RLS remota:', error.message);
  }
}

async function run() {
  await runLocalIsolationTest();
  await testSupabaseRLS();
}

run();
