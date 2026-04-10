import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/storage/database/pg-pool';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取知识库详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM knowledge_base WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: '知识库条目不存在' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取知识库详情失败:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}

// PUT - 更新知识库条目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      category,
      court,
      case_number,
      parties,
      case_type,
      procedure_type,
      result,
      summary,
      full_text,
      is_active
    } = body;

    const client = await pool.connect();
    try {
      const result_db = await client.query(
        `UPDATE knowledge_base 
         SET category = COALESCE($1, category),
             court = COALESCE($2, court),
             case_number = COALESCE($3, case_number),
             parties = COALESCE($4, parties),
             case_type = COALESCE($5, case_type),
             procedure_type = COALESCE($6, procedure_type),
             result = COALESCE($7, result),
             summary = COALESCE($8, summary),
             full_text = COALESCE($9, full_text),
             is_active = COALESCE($10, is_active),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $11
         RETURNING *`,
        [category, court, case_number, parties, case_type, procedure_type, result, summary, full_text, is_active, id]
      );

      if (result_db.rows.length === 0) {
        return NextResponse.json({ error: '知识库条目不存在' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: result_db.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('更新知识库失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// DELETE - 删除知识库条目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM knowledge_base WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: '知识库条目不存在' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('删除知识库失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
