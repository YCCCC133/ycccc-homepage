import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/storage/database/pg-pool';

// 创建线索 (公开API)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 兼容驼峰和下划线命名
    const name = body.name;
    const phone = body.phone;
    const idCard = body.idCard || body.id_card;
    const companyName = body.companyName || body.company_name;
    const companyAddress = body.companyAddress || body.company_address;
    const owedAmount = body.owedAmount ?? body.owed_amount;
    const owedMonths = body.owedMonths ?? body.owed_months;
    const workerCount = body.workerCount ?? body.worker_count;
    const description = body.description;
    const evidence = body.evidence;
    const hasEvidence = body.hasEvidence;

    // 基本验证
    if (!name || !phone || !companyName) {
      return NextResponse.json(
        { success: false, error: '姓名、手机号和公司名称不能为空' },
        { status: 400 }
      );
    }

    // 手机号格式验证
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: '请输入正确的手机号码' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // 生成线索编号
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const reportNumber = `XC${dateStr}${randomNum}`;

      // 插入数据库
      const result = await client.query(
        `INSERT INTO reports (
          name, phone, id_card, company_name, company_address,
          owed_amount, owed_months, worker_count, description, evidence,
          status, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, name, phone, company_name, owed_amount, status, created_at`,
        [
          name,
          phone,
          idCard || null,
          companyName,
          companyAddress || null,
          owedAmount || 0,
          owedMonths || 1,
          workerCount || 1,
          description || null,
          hasEvidence ? evidence : null,
          'pending',
          '自主填报',
        ]
      );

      const report = result.rows[0];

      return NextResponse.json({
        success: true,
        data: {
          id: report.id,
          reportNumber,
          name: report.name,
          phone: report.phone,
          companyName: report.company_name,
          owedAmount: report.owed_amount,
          status: report.status,
          createdAt: report.created_at,
        },
        message: '线索提交成功',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('提交线索失败:', error);
    return NextResponse.json(
      { success: false, error: '提交失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 获取线索列表 (公开查询接口)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get('phone');
    const reportNumber = searchParams.get('reportNumber');

    // 至少需要一个查询条件
    if (!phone && !reportNumber) {
      return NextResponse.json(
        { success: false, error: '请提供手机号或线索编号' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      let query = `
        SELECT id, name, company_name, owed_amount, status, created_at, updated_at
        FROM reports
        WHERE 1=1
      `;
      const params: (string | null)[] = [];
      let paramIndex = 1;

      if (phone) {
        query += ` AND phone = $${paramIndex}`;
        params.push(phone);
        paramIndex++;
      }

      if (reportNumber) {
        query += ` AND id::TEXT LIKE $${paramIndex}`;
        params.push(`%${reportNumber}%`);
        paramIndex++;
      }

      query += ' ORDER BY created_at DESC';

      const result = await client.query(query, params);

      // 姓名脱敏
      const reports = result.rows.map((row) => ({
        ...row,
        name: row.name ? `${row.name[0]}**` : null,
      }));

      return NextResponse.json({
        success: true,
        data: reports,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('查询线索失败:', error);
    return NextResponse.json(
      { success: false, error: '查询失败' },
      { status: 500 }
    );
  }
}
