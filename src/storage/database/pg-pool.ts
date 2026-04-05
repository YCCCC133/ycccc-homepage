import { Pool } from 'pg';

// 创建数据库连接池
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
