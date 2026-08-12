require('dotenv').config();

// Script de prueba RLS para Supabase
// Se asume que en el entorno donde se ejecute exista dotenv y node-fetch (o fetch nativo en Node 18+)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'URL_DE_TU_SUPABASE';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'LLAVE_ANON_DE_TU_SUPABASE';

async function fetchFromSupabase(table, token) {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, { headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error HTTP: ${res.status} - ${errorText}`);
  }
  return res.json();
}

async function testIsolation() {
  console.log('--- Iniciando Prueba de Aislamiento RLS en Supabase ---\n');
  
  // Estos JWT deberan ser reemplazados por JWT reales de Supabase Auth
  // pertenecientes a usuarios de organizaciones distintas
  const tokenOrgA = process.env.TEST_TOKEN_ORG_A || 'Reemplazar_Con_JWT_Org_A';
  const tokenOrgB = process.env.TEST_TOKEN_ORG_B || 'Reemplazar_Con_JWT_Org_B';
  
  if (tokenOrgA.startsWith('Reemplazar') || tokenOrgB.startsWith('Reemplazar')) {
    console.warn('⚠️ ADVERTENCIA: Los tokens JWT son placeholders. La prueba fallará o no será representativa.');
    console.warn('Por favor, configura TEST_TOKEN_ORG_A y TEST_TOKEN_ORG_B en tus variables de entorno.\n');
  }

  try {
    console.log('1. Obteniendo Casos de la Org A...');
    const casesOrgA = await fetchFromSupabase('cases', tokenOrgA);
    console.log(`   -> Org A tiene acceso a ${casesOrgA.length} casos.`);

    console.log('2. Obteniendo Casos de la Org B...');
    const casesOrgB = await fetchFromSupabase('cases', tokenOrgB);
    console.log(`   -> Org B tiene acceso a ${casesOrgB.length} casos.`);

    console.log('3. Validando aislamiento mutuo...');
    let violation = false;
    // Si tenemos la propiedad 'organization_id' expuesta en la respuesta
    casesOrgA.forEach(c => {
      if (casesOrgB.find(cb => cb.id === c.id)) {
        violation = true;
        console.error(`   ❌ VIOLACION RLS: El caso ${c.id} es visible por ambas organizaciones.`);
      }
    });

    if (!violation) {
      console.log('   ✅ PRUEBA EXITOSA: Ningun caso es visible en ambas organizaciones simultaneamente.');
    }

  } catch (error) {
    console.error('Error durante la prueba RLS:', error.message);
  }
}

testIsolation();
