import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/storage/database/pg-pool';
import { S3Storage } from 'coze-coding-dev-sdk';

// 初始化存储
const storage = process.env.COZE_BUCKET_ENDPOINT_URL ? new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  bucketName: process.env.COZE_BUCKET_NAME,
}) : null;

// 格式化公告数据，生成图片 URL
async function formatAnnouncement(item: Record<string, unknown>): Promise<Record<string, unknown>> {
  const result = { ...item };
  
  // 如果有图片 URL 且是 key（不以 http 开头），则生成签名 URL
  if (item.image_url && typeof item.image_url === 'string' && !item.image_url.startsWith('http') && storage) {
    try {
      result.image_url = await storage.generatePresignedUrl({
        key: item.image_url,
        expireTime: 7 * 24 * 60 * 60,
      });
    } catch {
      // 忽略错误，保留原值
    }
  }
  
  return result;
}

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
        `SELECT id, title, summary, content, category, image_url,
                is_published, is_top, is_banner, sort_order,
                author, created_at, updated_at
         FROM announcements WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: '公告不存在' }, { status: 404 });
      }
      
      const formatted = await formatAnnouncement(result.rows[0] as Record<string, unknown>);
      return NextResponse.json({ success: true, data: formatted });
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
    const {
      title,
      content,
      summary,
      category,
      is_published,
      image_url,
      author,
      is_top,
      is_banner,
      sort_order
    } = body;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE announcements 
         SET title = COALESCE($1, title),
             summary = COALESCE($2, summary),
             content = COALESCE($3, content),
             category = COALESCE($4, category),
             is_published = COALESCE($5, is_published),
             image_url = COALESCE($6, image_url),
             author = COALESCE($7, author),
             is_top = COALESCE($8, is_top),
             is_banner = COALESCE($9, is_banner),
             sort_order = COALESCE($10, sort_order),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $11
         RETURNING *`,
        [title, summary, content, category, is_published, image_url, author, is_top, is_banner, sort_order, id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: '公告不存在' }, { status: 404 });
      }
      
      const formatted = await formatAnnouncement(result.rows[0] as Record<string, unknown>);
      return NextResponse.json({ success: true, data: formatted });
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

// 批量更新状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, value } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: '缺少操作类型' }, { status: 400 });
    }

    let field: string;
    switch (action) {
      case 'status':
        field = 'is_published';
        break;
      case 'top':
        field = 'is_top';
        break;
      case 'banner':
        field = 'is_banner';
        break;
      default:
        return NextResponse.json({ success: false, error: '未知操作类型' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE announcements 
         SET ${field} = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [value ?? true, id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: '公告不存在' }, { status: 404 });
      }
      
      const formatted = await formatAnnouncement(result.rows[0] as Record<string, unknown>);
      return NextResponse.json({ success: true, data: formatted });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('更新公告状态失败:', error);
    return NextResponse.json({ success: false, error: '更新公告状态失败' }, { status: 500 });
  }
}
