import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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
    const client = getSupabaseClient();
    
    let query = client
      .from('cases')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `case_number.ilike.%${search}%,plaintiff_name.ilike.%${search}%,defendant_name.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
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

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('cases')
      .insert({
        case_number,
        plaintiff_name,
        plaintiff_phone: plaintiff_phone || null,
        defendant_name: defendant_name || null,
        case_type: case_type || null,
        amount: amount || 0,
        status: status || 'pending',
        filing_date: filing_date || null,
        handler: handler || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('创建案件失败:', error);
    return NextResponse.json({ error: '创建案件失败' }, { status: 500 });
  }
}
