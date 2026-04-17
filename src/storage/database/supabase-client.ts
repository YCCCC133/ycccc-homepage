import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 不使用缓存标志，确保每次都检查最新环境变量
interface SupabaseCredentials {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

function loadEnvFromCoze(): void {
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

    console.log('[supabase-client] Loading from coze_workload_identity...');
    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    let loaded = false;
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        // 去除引号
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        // 只设置还没有设置的变量
        if (!process.env[key]) {
          process.env[key] = value;
          loaded = true;
        }
      }
    }
    if (loaded) {
      console.log('[supabase-client] Loaded env vars from coze_workload_identity');
    }
  } catch (e) {
    console.log('[supabase-client] coze_workload_identity not available:', e instanceof Error ? e.message : 'unknown');
  }
}

function ensureEnvLoaded(): void {
  // 首先尝试从 Coze 加载环境变量（如果需要）
  if (!process.env.COZE_SUPABASE_URL || !process.env.COZE_SUPABASE_ANON_KEY) {
    loadEnvFromCoze();
  }
  
  // 尝试从 .env 加载（开发环境）
  if (!process.env.COZE_SUPABASE_URL || !process.env.COZE_SUPABASE_ANON_KEY) {
    try {
      require('dotenv').config();
    } catch {
      // dotenv not available
    }
  }
}

function getSupabaseCredentials(): SupabaseCredentials {
  ensureEnvLoaded();

  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    console.error('[supabase-client] COZE_SUPABASE_URL is not set');
  }
  if (!anonKey) {
    console.error('[supabase-client] COZE_SUPABASE_ANON_KEY is not set');
  }

  if (!url || !anonKey) {
    const error = `Supabase credentials missing: COZE_SUPABASE_URL=${url ? 'SET' : 'MISSING'}, COZE_SUPABASE_ANON_KEY=${anonKey ? 'SET' : 'MISSING'}`;
    console.error(`[supabase-client] ${error}`);
    throw new Error(error);
  }

  return { url, anonKey, serviceRoleKey };
}

function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey, serviceRoleKey } = getSupabaseCredentials();

  let key: string;
  let keyType: string;
  
  if (token) {
    // 使用用户提供的 token
    key = token;
    keyType = 'user_token';
  } else if (serviceRoleKey) {
    // 使用 service role key（服务器端）
    key = serviceRoleKey;
    keyType = 'service_role';
  } else {
    // 使用 anon key
    key = anonKey;
    keyType = 'anon';
  }

  console.log(`[supabase-client] Creating client with ${keyType}`);

  const config: Record<string, unknown> = {
    db: {
      timeout: 30000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  };

  if (token) {
    config.global = {
      headers: { Authorization: `Bearer ${token}` },
    };
  }

  return createClient(url, key, config);
}

// 获取使用 service role key 的客户端（绕过 RLS）
function getSupabaseServiceRoleClient(): SupabaseClient {
  const { url, serviceRoleKey } = getSupabaseCredentials();
  
  if (!serviceRoleKey) {
    console.warn('[supabase-client] No service role key, falling back to anon key');
    return getSupabaseClient();
  }
  
  console.log('[supabase-client] Creating service role client');
  
  return createClient(url, serviceRoleKey, {
    db: {
      timeout: 30000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { getSupabaseClient, getSupabaseCredentials, ensureEnvLoaded, getSupabaseServiceRoleClient };
