import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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

    // 生成线索编号
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const reportNumber = `XC${dateStr}${randomNum}`;

    // 使用 Supabase SDK 插入数据
    const client = getSupabaseClient();
    
    const insertData: Record<string, unknown> = {
      name,
      phone,
      id_card: idCard || null,
      company_name: companyName,
      company_address: companyAddress || null,
      owed_amount: owedAmount || 0,
      owed_months: owedMonths || 1,
      worker_count: workerCount || 1,
      description: description || null,
      evidence: hasEvidence ? evidence : null,
      status: 'pending',
      source: '自主填报',
    };

    const { data, error } = await client
      .from('reports')
      .insert(insertData)
      .select('id, name, phone, company_name, owed_amount, status, created_at')
      .single();

    if (error) {
      console.error('[reports] Insert error:', error);
      return NextResponse.json(
        { success: false, error: `提交失败: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        reportNumber,
        name: data.name,
        phone: data.phone,
        companyName: data.company_name,
        owedAmount: data.owed_amount,
        status: data.status,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error('[reports] Error:', error);
    return NextResponse.json(
      { success: false, error: '提交失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 获取线索列表 (公开API)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');

    const offset = (page - 1) * pageSize;

    const client = getSupabaseClient();
    
    let query = client
      .from('reports')
      .select('id, name, phone, company_name, owed_amount, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[reports] Query error:', error);
      return NextResponse.json(
        { success: false, error: '查询失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('[reports] Error:', error);
    return NextResponse.json(
      { success: false, error: '查询失败' },
      { status: 500 }
    );
  }
}
