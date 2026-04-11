import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/storage/database/pg-pool';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取案件列表
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const offset = (page - 1) * pageSize;

  try {
    const client = await pool.connect();
    
    try {
      let whereClause = '1=1';
      const params: (string | number)[] = [];
      let paramIndex = 1;

      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (search) {
        whereClause += ` AND (case_number ILIKE $${paramIndex} OR plaintiff_name ILIKE $${paramIndex} OR defendant_name ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM cases WHERE ${whereClause}`;
      const countResult = await client.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // 获取数据
      const dataQuery = `
        SELECT * FROM cases 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(pageSize, offset);
      
      const dataResult = await client.query(dataQuery, params);

      return NextResponse.json({
        success: true,
        data: dataResult.rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('获取案件列表失败:', error);
    return NextResponse.json({ error: '获取案件列表失败' }, { status: 500 });
  }
}

// POST - 创建新案件
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      case_number,
      plaintiff_name,
      plaintiff_phone,
      defendant_name,
      case_type,
      amount,
      status,
      filing_date,
      handler,
      notes,
    } = body;

    if (!case_number || !plaintiff_name) {
      return NextResponse.json({ error: '案件编号和原告姓名为必填项' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO cases (case_number, plaintiff_name, plaintiff_phone, defendant_name, case_type, amount, status, filing_date, handler, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [case_number, plaintiff_name, plaintiff_phone, defendant_name, case_type, amount || 0, status || 'pending', filing_date, handler, notes]
      );

      return NextResponse.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('创建案件失败:', error);
    return NextResponse.json({ error: '创建案件失败' }, { status: 500 });
  }
}
