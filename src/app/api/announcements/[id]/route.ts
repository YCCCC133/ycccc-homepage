import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 获取公告详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM announcements WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: '公告不存在' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取公告详情失败:', error);
    return NextResponse.json({ success: false, error: '获取公告详情失败' }, { status: 500 });
  }
}

// 更新公告
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, category, is_published } = body;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE announcements 
         SET title = COALESCE($1, title),
             content = COALESCE($2, content),
             category = COALESCE($3, category),
             is_published = COALESCE($4, is_published),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [title, content, category, is_published, id]
      );
      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: '公告不存在' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('更新公告失败:', error);
    return NextResponse.json({ success: false, error: '更新公告失败' }, { status: 500 });
  }
}

// 删除公告
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM announcements WHERE id = $1 RETURNING id',
        [id]
      );
      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: '公告不存在' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('删除公告失败:', error);
    return NextResponse.json({ success: false, error: '删除公告失败' }, { status: 500 });
  }
}
