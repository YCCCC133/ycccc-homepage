import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/storage/database/pg-pool';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取所有设置和操作日志
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const client = await pool.connect();
    
    try {
      const settingsResult = await client.query('SELECT * FROM settings ORDER BY key');
      
      // 获取最近10条操作日志
      const logsResult = await client.query(
        'SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT 10'
      );
      
      return NextResponse.json({ 
        success: true, 
        data: settingsResult.rows,
        logs: logsResult.rows 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取设置失败:', error);
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 });
  }
}

// PUT - 批量更新设置
export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const settings = body.settings;

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: '参数格式错误' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const setting of settings) {
        await client.query(
          `INSERT INTO settings (key, value, updated_at) 
           VALUES ($1, $2, NOW())
           ON CONFLICT (key) 
           DO UPDATE SET value = $2, updated_at = NOW()`,
          [setting.key, setting.value]
        );
      }

      // 记录操作日志
      await client.query(
        'INSERT INTO operation_logs (action, type) VALUES ($1, $2)',
        ['更新系统设置', 'update']
      );

      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('更新设置失败:', error);
    return NextResponse.json({ error: '更新设置失败' }, { status: 500 });
  }
}
