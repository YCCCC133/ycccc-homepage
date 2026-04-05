import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/storage/database/pg-pool';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// GET - 获取文件列表
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get('case_id');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const offset = (page - 1) * pageSize;

  try {
    const client = await pool.connect();
    
    try {
      let whereClause = '1=1';
      const params: (string | number)[] = [];
      let paramIndex = 1;

      if (caseId) {
        whereClause += ` AND case_id = $${paramIndex}`;
        params.push(caseId);
        paramIndex++;
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM files WHERE ${whereClause}`;
      const countResult = await client.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // 获取数据
      const dataQuery = `
        SELECT f.*, c.case_number 
        FROM files f 
        LEFT JOIN cases c ON f.case_id = c.id
        WHERE ${whereClause}
        ORDER BY f.created_at DESC
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
    console.error('获取文件列表失败:', error);
    return NextResponse.json({ error: '获取文件列表失败' }, { status: 500 });
  }
}

// POST - 创建文件记录（实际上传需要配合对象存储）
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      type,
      size,
      case_id,
      uploaded_by,
      url,
    } = body;

    if (!name) {
      return NextResponse.json({ error: '文件名为必填项' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO files (name, type, size, case_id, uploaded_by, url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, type, size || 0, case_id, uploaded_by || '管理员', url]
      );

      return NextResponse.json({ success: true, data: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('创建文件记录失败:', error);
    return NextResponse.json({ error: '创建文件记录失败' }, { status: 500 });
  }
}
