/**
 * Cliente do Supabase, usado apenas para o Storage.
 * A service role key ignora as politicas de RLS: fica so no backend.
 */
const { createClient } = require('@supabase/supabase-js');
const { env } = require('./env');

let cliente = null;

function obterClienteSupabase() {
  if (cliente) return cliente;

  const { url, serviceRoleKey } = env.supabase;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Credenciais do Supabase ausentes. Verifique SUPABASE_URL e ' +
        'SUPABASE_SERVICE_ROLE_KEY no .env'
    );
  }

  cliente = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return cliente;
}

module.exports = { obterClienteSupabase };
