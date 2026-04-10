import { createClient, SupabaseClient } from '@supabase/supabase-js';

let envLoaded = false;
let initError: string | null = null;

interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

function loadEnv(): void {
  if (envLoaded) return;
  
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`[supabase-client] loadEnv called (production=${isProduction})`);
  console.log(`[supabase-client] Initial env check: COZE_SUPABASE_URL=${process.env.COZE_SUPABASE_URL ? 'SET' : 'NOT_SET'}, COZE_SUPABASE_ANON_KEY=${process.env.COZE_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET'}`);
  
  if (process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY) {
    console.log('[supabase-client] Environment variables already set');
    envLoaded = true;
    return;
  }

  // Try loading from .env file
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv').config();
    if (process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY) {
      console.log('[supabase-client] Loaded from .env file');
      envLoaded = true;
      return;
    }
  } catch (e) {
    console.log('[supabase-client] dotenv not available or failed');
  }

  // Try coze_workload_identity only if env vars still not set
  try {
    const { execSync } = require('child_process');
    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

    console.log('[supabase-client] Trying to load from coze_workload_identity...');
    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    console.log('[supabase-client] coze_workload_identity output:', output.substring(0, 200));
    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch (e) {
    console.log('[supabase-client] coze_workload_identity not available or failed:', e instanceof Error ? e.message : String(e));
  }

  console.log(`[supabase-client] Final env check: COZE_SUPABASE_URL=${process.env.COZE_SUPABASE_URL ? 'SET' : 'NOT_SET'}, COZE_SUPABASE_ANON_KEY=${process.env.COZE_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET'}`);
  envLoaded = true;
}

function getSupabaseCredentials(): SupabaseCredentials {
  loadEnv();

  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    initError = `Supabase credentials missing: COZE_SUPABASE_URL=${url ? 'SET' : 'MISSING'}, COZE_SUPABASE_ANON_KEY=${anonKey ? 'SET' : 'MISSING'}`;
    console.error(`[supabase-client] ${initError}`);
    throw new Error(initError);
  }

  console.log('[supabase-client] Credentials loaded successfully, URL:', url.substring(0, 20) + '...');
  return { url, anonKey };
}

function getSupabaseServiceRoleKey(): string | undefined {
  loadEnv();
  return process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
}

function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();

  let key: string;
  if (token) {
    key = anonKey;
  } else {
    const serviceRoleKey = getSupabaseServiceRoleKey();
    key = serviceRoleKey ?? anonKey;
  }

  console.log('[supabase-client] Creating Supabase client with key type:', token ? 'user' : (getSupabaseServiceRoleKey() ? 'service' : 'anon'));

  if (token) {
    return createClient(url, key, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      db: {
        timeout: 30000,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createClient(url, key, {
    db: {
      timeout: 30000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { loadEnv, getSupabaseCredentials, getSupabaseServiceRoleKey, getSupabaseClient };
