import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/storage/database/pg-pool';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取单个模板
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM templates WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: '模板不存在' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取模板详情失败:', error);
    return NextResponse.json({ error: '获取模板详情失败' }, { status: 500 });
  }
}

// PUT - 更新模板
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const client = await pool.connect();
    
    try {
      const fields: string[] = [];
      const values: (string | number | boolean | null)[] = [];
      let paramIndex = 1;

      const allowedFields = ['name', 'type', 'content', 'variables', 'is_active'];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          if (field === 'variables') {
            fields.push(`${field} = $${paramIndex}`);
            values.push(JSON.stringify(body[field]));
          } else {
            fields.push(`${field} = $${paramIndex}`);
            values.push(body[field]);
          }
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });
      }

      fields.push(`updated_at = $${paramIndex}`);
      values.push(new Date().toISOString());
      values.push(id);

      const query = `UPDATE templates SET ${fields.join(', ')} WHERE id = $${paramIndex + 1} RETURNING *`;
      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: '模板不存在' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('更新模板失败:', error);
    return NextResponse.json({ error: '更新模板失败' }, { status: 500 });
  }
}

// DELETE - 删除模板
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query('DELETE FROM templates WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: '模板不存在' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('删除模板失败:', error);
    return NextResponse.json({ error: '删除模板失败' }, { status: 500 });
  }
}
