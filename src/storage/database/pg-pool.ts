import { Pool } from 'pg';

// 获取数据库连接字符串
// Coze 平台使用 PGDATABASE_URL，同时兼容 DATABASE_URL
function getConnectionString(): string {
  return process.env.DATABASE_URL || process.env.PGDATABASE_URL || '';
}

const connectionString = getConnectionString();

if (!connectionString) {
  console.warn('[pg-pool] Warning: No database connection string found. Set DATABASE_URL or PGDATABASE_URL.');
}

// 创建数据库连接池
export const pool = new Pool({
  connectionString,
  // 连接超时设置
  connectionTimeoutMillis: 10000, // 10s 连接超时
  query_timeout: 30000,           // 30s 查询超时
  statement_timeout: 30000,       // 30s 语句超时
  idleTimeoutMillis: 30000,       // 30s 空闲超时
  max: 10,                        // 最大连接数
});

// 监听连接池错误
pool.on('error', (err) => {
  console.error('[pg-pool] Unexpected pool error:', err.message);
});
