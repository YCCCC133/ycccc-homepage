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

    const client = getSupabaseClient();

    // 插入数据库
    const { data, error } = await client
      .from('reports')
      .insert({
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
      })
      .select('id, name, phone, company_name, owed_amount, status, created_at')
      .single();

    if (error) throw error;

    // 生成线索编号
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const reportNumber = `XC${dateStr}${randomNum}`;

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
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error('创建线索失败:', error);
    return NextResponse.json(
      { success: false, error: '创建线索失败' },
      { status: 500 }
    );
  }
}
