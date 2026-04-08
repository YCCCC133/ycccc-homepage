import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 获取公告列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const publishedOnly = searchParams.get('published_only') === 'true';

    const client = await pool.connect();
    try {
      const query = `
        SELECT id, title, content, category, image_url, created_at, updated_at
        FROM announcements
        ${publishedOnly ? 'WHERE is_published = true' : ''}
        ORDER BY created_at DESC
        LIMIT $1
      `;
      const result = await client.query(query, [limit]);
      return NextResponse.json({ success: true, data: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取公告列表失败:', error);
    return NextResponse.json({ success: false, error: '获取公告列表失败' }, { status: 500 });
  }
}

// 创建公告 (需要管理员权限)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, is_published, image_url } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: '标题和内容不能为空' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO announcements (title, content, category, is_published, image_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title, content, category, image_url, is_published, created_at, updated_at`,
        [title, content, category || '通知', is_published ?? true, image_url || null]
      );
      return NextResponse.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('创建公告失败:', error);
    return NextResponse.json({ success: false, error: '创建公告失败' }, { status: 500 });
  }
}
