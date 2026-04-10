import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { S3Storage } from 'coze-coding-dev-sdk';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
        expireTime: 7 * 24 * 60 * 60, // 7 天
      });
    } catch {
      // 如果生成失败，保留原值
    }
  }
  
  return result;
}

// 获取公告列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const publishedOnly = searchParams.get('published_only') !== 'false';
    const bannerOnly = searchParams.get('banner_only') === 'true';
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';
    const featuredOnly = searchParams.get('featured_only') === 'true';

    const client = await pool.connect();
    try {
      const conditions: string[] = [];
      const values: (string | number | boolean)[] = [];
      let paramIndex = 1;

      if (publishedOnly) {
        conditions.push(`is_published = $${paramIndex++}`);
        values.push(true);
      }

      if (bannerOnly) {
        conditions.push(`is_banner = $${paramIndex++}`);
        values.push(true);
      }

      if (featuredOnly) {
        conditions.push(`(is_top = $${paramIndex++} OR is_banner = $${paramIndex++})`);
        values.push(true, true);
      }

      if (category) {
        conditions.push(`category = $${paramIndex++}`);
        values.push(category);
      }

      if (search) {
        conditions.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex} OR summary ILIKE $${paramIndex})`);
        values.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const validSortFields = ['created_at', 'updated_at', 'sort_order', 'title'];
      const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const orderClause = `ORDER BY is_top DESC, ${safeSortBy} ${safeSortOrder}`;

      const query = `
        SELECT id, title, summary, content, category, image_url, 
               is_published, is_top, is_banner, sort_order,
               author, created_at, updated_at
        FROM announcements
        ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      values.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total FROM announcements ${whereClause}
      `;
      const countValues = values.slice(0, -2);

      const [result, countResult] = await Promise.all([
        client.query(query, values),
        client.query(countQuery, countValues)
      ]);

      // 格式化图片 URL
      const formattedData = await Promise.all(
        result.rows.map((row) => formatAnnouncement(row as Record<string, unknown>))
      );

      return NextResponse.json({
        success: true,
        data: formattedData,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit,
          offset,
          hasMore: offset + result.rows.length < parseInt(countResult.rows[0].total)
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取公告列表失败:', error);
    return NextResponse.json({ success: false, error: '获取公告列表失败' }, { status: 500 });
  }
}

// 创建公告
export async function POST(request: NextRequest) {
  try {
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

    if (!title || !content) {
      return NextResponse.json({ success: false, error: '标题和内容不能为空' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO announcements (title, summary, content, category, is_published, image_url, author, is_top, is_banner, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          title,
          summary || null,
          content,
          category || '通知',
          is_published ?? true,
          image_url || null,
          author || '管理员',
          is_top ?? false,
          is_banner ?? false,
          sort_order ?? 0
        ]
      );
      
      const formatted = await formatAnnouncement(result.rows[0] as Record<string, unknown>);
      return NextResponse.json({ success: true, data: formatted });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('创建公告失败:', error);
    return NextResponse.json({ success: false, error: '创建公告失败' }, { status: 500 });
  }
}
