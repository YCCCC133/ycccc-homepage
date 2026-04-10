import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证管理员身份
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value;
  return !!token;
}

// 获取文书列表
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const offset = (page - 1) * pageSize;

  const client = getSupabaseClient();

  try {
    let query = client
      .from('documents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (type && type !== '全部') {
      query = query.eq('document_type', type);
    }

    if (search) {
      query = query.or(`applicant_name.ilike.%${search}%,applicant_phone.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('获取文书列表失败:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}

// 删除文书
export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const client = getSupabaseClient();

    if (!id) {
      return NextResponse.json({ error: '缺少ID参数' }, { status: 400 });
    }

    const { error } = await client
      .from('documents')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除文书失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
