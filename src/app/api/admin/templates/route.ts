import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/storage/database/pg-pool';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取模板列表
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    const client = await pool.connect();
    
    try {
      let query = 'SELECT * FROM templates';
      const params: string[] = [];

      if (type) {
        query += ' WHERE type = $1';
        params.push(type);
      }

      query += ' ORDER BY created_at DESC';

      const result = await client.query(query, params);
      return NextResponse.json({ success: true, data: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取模板列表失败:', error);
    return NextResponse.json({ error: '获取模板列表失败' }, { status: 500 });
  }
}

// POST - 创建模板
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, content, variables, is_active } = body;

    if (!name || !type) {
      return NextResponse.json({ error: '模板名称和类型为必填项' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO templates (name, type, content, variables, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, type, content, JSON.stringify(variables || []), is_active !== false]
      );

      return NextResponse.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('创建模板失败:', error);
    return NextResponse.json({ error: '创建模板失败' }, { status: 500 });
  }
}
