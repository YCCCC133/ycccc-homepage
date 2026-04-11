import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/storage/database/pg-pool';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取单个案件详情
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
      const result = await client.query('SELECT * FROM cases WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: '案件不存在' }, { status: 404 });
      }

      // 获取关联的文件
      const filesResult = await client.query('SELECT * FROM files WHERE case_id = $1', [id]);

      return NextResponse.json({
        success: true,
        data: {
          ...result.rows[0],
          files: filesResult.rows,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取案件详情失败:', error);
    return NextResponse.json({ error: '获取案件详情失败' }, { status: 500 });
  }
}

// PUT - 更新案件
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
      const values: (string | number | null)[] = [];
      let paramIndex = 1;

      const allowedFields = [
        'case_number', 'plaintiff_name', 'plaintiff_phone', 'defendant_name',
        'case_type', 'amount', 'status', 'filing_date', 'close_date', 'handler', 'notes'
      ];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          fields.push(`${field} = $${paramIndex}`);
          values.push(body[field]);
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });
      }

      fields.push(`updated_at = $${paramIndex}`);
      values.push(new Date().toISOString());
      values.push(id);

      const query = `UPDATE cases SET ${fields.join(', ')} WHERE id = $${paramIndex + 1} RETURNING *`;
      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: '案件不存在' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('更新案件失败:', error);
    return NextResponse.json({ error: '更新案件失败' }, { status: 500 });
  }
}

// DELETE - 删除案件
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
      // 先删除关联的文件
      await client.query('DELETE FROM files WHERE case_id = $1', [id]);
      
      // 再删除案件
      const result = await client.query('DELETE FROM cases WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: '案件不存在' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('删除案件失败:', error);
    return NextResponse.json({ error: '删除案件失败' }, { status: 500 });
  }
}
