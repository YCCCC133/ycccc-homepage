import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取知识库列表
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isActive = searchParams.get('is_active');

    const conditions: string[] = [];
    const values: (string | number | boolean)[] = [];
    let paramIndex = 1;

    if (category) {
      conditions.push(`category = $${paramIndex++}`);
      values.push(category);
    }

    if (isActive !== null) {
      conditions.push(`is_active = $${paramIndex++}`);
      values.push(isActive === 'true');
    }

    if (search) {
      conditions.push(`(case_number ILIKE $${paramIndex} OR parties ILIKE $${paramIndex} OR summary ILIKE $${paramIndex} OR full_text ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const client = await pool.connect();
    try {
      // 获取总数
      const countResult = await client.query(
        `SELECT COUNT(*) as total FROM knowledge_base ${whereClause}`,
        values
      );

      // 获取分页数据
      const offset = (page - 1) * pageSize;
      const result = await client.query(
        `SELECT id, category, court, case_number, parties, case_type, procedure_type, result, summary, is_active, created_at, updated_at
         FROM knowledge_base ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        [...values, pageSize, offset]
      );

      return NextResponse.json({
        success: true,
        data: result.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        pageSize,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取知识库失败:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}

// POST - 创建知识库条目
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
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

    if (!case_number || !parties) {
      return NextResponse.json({ error: '案号和当事人不能为空' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const result_db = await client.query(
        `INSERT INTO knowledge_base (category, court, case_number, parties, case_type, procedure_type, result, summary, full_text, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          category || '其他',
          court || null,
          case_number,
          parties,
          case_type || null,
          procedure_type || null,
          result || null,
          summary || null,
          full_text || null,
          is_active ?? true
        ]
      );

      return NextResponse.json({ success: true, data: result_db.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('创建知识库失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
